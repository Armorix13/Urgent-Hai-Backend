import Collaborator from "../models/collaborator.model.js";
import Section from "../models/section.model.js";
import { helper } from "../utils/helper.js";

export const getCollaboratorById = async (id) => {
  return await Collaborator.findById(id);
};

export const getAllCollaborators = async () => {
  return await Collaborator.find().sort({ createdAt: -1 });
};

async function fetchSectionsForCollaboratorId(collaboratorId) {
  return Section.find({ collaboratorId: collaboratorId })
    .sort({ order: 1, createdAt: -1 })
    .lean();
}

/** Batch-load sections keyed by collaboratorId string. */
async function sectionsGroupedByCollaboratorIds(collaboratorIds) {
  const ids = [...new Set(collaboratorIds.map((id) => String(id)))].filter(Boolean);
  const map = new Map(ids.map((id) => [id, []]));
  if (!ids.length) return map;

  const rows = await Section.find({
    collaboratorId: { $in: ids },
  })
    .sort({ order: 1, createdAt: -1 })
    .lean();

  for (const s of rows) {
    const key = String(s.collaboratorId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return map;
}

/**
 * Upsert sections for a collaborator:
 * - Sections with a recognised _id are updated in place.
 * - Sections without an _id (or with an unrecognised _id) are created.
 * - Existing sections whose _id is absent from the incoming array are deleted.
 */
async function upsertSections(collaboratorId, sections) {
  const existingSections = await Section.find({ collaboratorId }).lean();
  const existingIdSet = new Set(existingSections.map((s) => String(s._id)));
  const keptExistingIds = new Set();

  const ops = sections.map((section) => {
    const { _id, ...fields } = section;
    const isExisting = _id && existingIdSet.has(String(_id));

    if (isExisting) {
      keptExistingIds.add(String(_id));
      return Section.findByIdAndUpdate(
        _id,
        { $set: fields },
        { new: true, runValidators: false }
      ).lean();
    }

    return new Section({ collaboratorId, ...fields })
      .save()
      .then((s) => s.toObject());
  });

  const results = await Promise.all(ops);

  const toDeleteIds = existingSections
    .filter((s) => !keptExistingIds.has(String(s._id)))
    .map((s) => s._id);

  if (toDeleteIds.length > 0) {
    await Section.deleteMany({ _id: { $in: toDeleteIds } });
  }

  return results.filter(Boolean);
}

/** Read profession or professionValue from body (add / update). */
function resolveProfessionFromBody(body) {
  if (!body || typeof body !== "object") return undefined;
  const hasP = Object.hasOwn(body, "profession");
  const hasV = Object.hasOwn(body, "professionValue");
  if (!hasP && !hasV) return undefined;
  const raw = body.profession ?? body.professionValue;
  if (raw == null) return undefined;
  const s = String(raw).trim();
  return s || undefined;
}

/** Responses include both keys; same stored string in `profession`. Never expose password. */
function withProfessionAliases(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o.password;
  if (o.profession != null && o.profession !== "") {
    o.professionValue = o.profession;
  } else {
    o.professionValue = null;
  }
  return o;
}

const addCollaborator = async (req) => {
  try {
    const {
      name,
      profile,
      phoneNumber,
      email,
      address,
      coverProfile,
      password,
      bio,
    } = req.body;
    const profession = resolveProfessionFromBody(req.body);

    let hashedPassword = null;
    if (password != null && String(password).trim() !== "") {
      hashedPassword = await helper.hashPassword(String(password));
    }

    const newCollaborator = new Collaborator({
      name,
      profile,
      phoneNumber,
      profession,
      ...(email != null && String(email).trim() !== ""
        ? { email: String(email).trim().toLowerCase() }
        : {}),
      ...(address !== undefined ? { address } : {}),
      ...(coverProfile !== undefined ? { coverProfile } : {}),
      ...(bio !== undefined ? { bio: String(bio).trim() } : {}),
      ...(hashedPassword ? { password: hashedPassword } : {}),
    });

    await newCollaborator.save();
    return withProfessionAliases(newCollaborator);
  } catch (error) {
    console.error("Add Collaborator Error:", error);
    throw new Error(error.message || "Failed to add collaborator");
  }
};

const updateCollaborator = async (req) => {
  try {
    const { id } = req.params;
    const {
      name,
      profile,
      phoneNumber,
      email,
      address,
      coverProfile,
      password,
      sections,
      bio,
    } = req.body;

    const collaborator = await getCollaboratorById(id);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }

    if (name !== undefined) collaborator.name = name;
    if (profile !== undefined) collaborator.profile = profile;
    if (phoneNumber !== undefined) collaborator.phoneNumber = phoneNumber;
    if (email !== undefined) {
      collaborator.email =
        email == null || String(email).trim() === ""
          ? null
          : String(email).trim().toLowerCase();
    }
    if (address !== undefined) collaborator.address = address;
    if (coverProfile !== undefined) collaborator.coverProfile = coverProfile;
    if (bio !== undefined) collaborator.bio = bio == null ? "" : String(bio).trim();
    if (password != null && String(password).trim() !== "") {
      collaborator.password = await helper.hashPassword(String(password));
    }
    const nextProfession = resolveProfessionFromBody(req.body);
    if (nextProfession !== undefined) collaborator.profession = nextProfession;

    await collaborator.save();

    const updatedSections = Array.isArray(sections)
      ? await upsertSections(id, sections)
      : await fetchSectionsForCollaboratorId(id);

    return {
      ...withProfessionAliases(collaborator),
      sectionCount: updatedSections.length,
      sections: updatedSections,
    };
  } catch (error) {
    console.error("Update Collaborator Error:", error);
    throw new Error(error.message || "Failed to update collaborator");
  }
};

const getCollaboratorByIdService = async (req) => {
  try {
    const { id } = req.params;
    const collaborator = await getCollaboratorById(id);

    if (!collaborator) {
      throw new Error("Collaborator not found");
    }

    const sections = await fetchSectionsForCollaboratorId(id);
    return {
      ...withProfessionAliases(collaborator),
      sectionCount: sections.length,
      sections,
    };
  } catch (error) {
    console.error("Get Collaborator Error:", error);
    throw new Error(error.message || "Failed to get collaborator");
  }
};

/** GET /collaborator/me — authenticated collaborator; no `sections` payload (light). */
const getCollaboratorMe = async (req) => {
  if (req.authKind !== "collaborator" || !req.collaboratorId) {
    const err = new Error("Collaborator authentication required");
    err.statusCode = 403;
    throw err;
  }
  const id = String(req.collaboratorId);
  const collaborator = await getCollaboratorById(id);
  if (!collaborator) {
    const err = new Error("Collaborator not found");
    err.statusCode = 404;
    throw err;
  }
  const sectionCount = await Section.countDocuments({ collaboratorId: id });
  const hasPassword =
    collaborator.password != null && String(collaborator.password).trim() !== "";
  return {
    ...withProfessionAliases(collaborator),
    sectionCount,
    hasPassword,
  };
};

/** PATCH /collaborator/me — profile fields + optional password; never updates `sections`. */
const updateCollaboratorMe = async (req) => {
  if (req.authKind !== "collaborator" || !req.collaboratorId) {
    const err = new Error("Collaborator authentication required");
    err.statusCode = 403;
    throw err;
  }
  const id = String(req.collaboratorId);
  const collaborator = await getCollaboratorById(id);
  if (!collaborator) {
    const err = new Error("Collaborator not found");
    err.statusCode = 404;
    throw err;
  }

  const {
    name,
    profile,
    phoneNumber,
    email,
    address,
    coverProfile,
    bio,
    currentPassword,
    newPassword,
  } = req.body;

  const np = newPassword != null ? String(newPassword).trim() : "";
  if (np.length > 0) {
    const hasExisting =
      collaborator.password != null && String(collaborator.password).trim() !== "";
    if (hasExisting) {
      const cp = currentPassword != null ? String(currentPassword) : "";
      if (!cp) {
        const err = new Error("Current password is required to set a new password");
        err.statusCode = 400;
        throw err;
      }
      const ok = await helper.verifyPassword(cp, collaborator.password);
      if (!ok) {
        const err = new Error("Current password is incorrect");
        err.statusCode = 400;
        throw err;
      }
    }
    collaborator.password = await helper.hashPassword(np);
    collaborator.jti = helper.generateRandomJti(16);
  }

  if (name !== undefined) collaborator.name = name;
  if (profile !== undefined) collaborator.profile = profile;
  if (phoneNumber !== undefined) collaborator.phoneNumber = phoneNumber;
  if (email !== undefined) {
    collaborator.email =
      email == null || String(email).trim() === ""
        ? null
        : String(email).trim().toLowerCase();
  }
  if (address !== undefined) collaborator.address = address;
  if (coverProfile !== undefined) collaborator.coverProfile = coverProfile;
  if (bio !== undefined) collaborator.bio = bio == null ? "" : String(bio).trim();
  const nextProfession = resolveProfessionFromBody(req.body);
  if (nextProfession !== undefined) collaborator.profession = nextProfession;

  await collaborator.save();
  const sectionCount = await Section.countDocuments({ collaboratorId: id });
  const hasPassword =
    collaborator.password != null && String(collaborator.password).trim() !== "";

  const collaboratorPayload = {
    ...withProfessionAliases(collaborator),
    sectionCount,
    hasPassword,
  };

  if (np.length > 0) {
    const payload = {
      _id: collaborator._id,
      jti: collaborator.jti,
      authKind: "collaborator",
    };
    return {
      collaborator: collaboratorPayload,
      access_token: helper.generateToken(payload, "access"),
      refresh_token: helper.generateToken(payload, "refresh"),
    };
  }

  return { collaborator: collaboratorPayload };
};

const getAllCollaboratorsService = async (req) => {
  try {
    const collaborators = await getAllCollaborators();
    const base = collaborators.map((c) => withProfessionAliases(c));
    const ids = base.map((c) => c._id);
    const byId = await sectionsGroupedByCollaboratorIds(ids);

    return base.map((c) => {
      const key = String(c._id);
      const sections = byId.get(key) ?? [];
      return {
        ...c,
        sectionCount: sections.length,
        sections,
      };
    });
  } catch (error) {
    console.error("Get All Collaborators Error:", error);
    throw new Error(error.message || "Failed to get collaborators");
  }
};

/**
 * Find collaborator by email (normalized) and/or phone (trimmed).
 * If both are provided, both must match the same document.
 */
async function findCollaboratorForPasswordSet({ email, phoneNumber }) {
  const emailTrim = email != null ? String(email).trim().toLowerCase() : "";
  const phoneTrim = phoneNumber != null ? String(phoneNumber).trim() : "";
  const hasEmail = emailTrim.length > 0;
  const hasPhone = phoneTrim.length > 0;

  if (hasEmail && hasPhone) {
    return Collaborator.findOne({
      email: emailTrim,
      phoneNumber: phoneTrim,
    });
  }
  if (hasEmail) {
    return Collaborator.findOne({ email: emailTrim });
  }
  return Collaborator.findOne({ phoneNumber: phoneTrim });
}

/** POST /collaborator/lookup — resolve profile and whether a password is set (no secrets). */
const lookupCollaborator = async (req) => {
  try {
    const { email, phoneNumber } = req.body;
    const collaborator = await findCollaboratorForPasswordSet({
      email,
      phoneNumber,
    });
    if (!collaborator) {
      throw new Error("Collaborator not found.");
    }
    const hasPassword =
      collaborator.password != null && String(collaborator.password).trim() !== "";
    return {
      hasPassword,
      email: collaborator.email ?? null,
      phoneNumber: collaborator.phoneNumber ?? null,
      name: collaborator.name ?? null,
    };
  } catch (error) {
    throw error;
  }
};

const setCollaboratorPassword = async (req) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const collaborator = await findCollaboratorForPasswordSet({ email, phoneNumber });
    if (!collaborator) {
      throw new Error("Collaborator not found for the given email or phone number.");
    }

    collaborator.password = await helper.hashPassword(String(password));
    await collaborator.save();
    return withProfessionAliases(collaborator);
  } catch (error) {
    console.error("Set collaborator password error:", error);
    throw new Error(error.message || "Failed to set password");
  }
};

const loginCollaborator = async (req) => {
  try {
    const { email, phoneNumber, password } = req.body;
    const collaborator = await findCollaboratorForPasswordSet({
      email,
      phoneNumber,
    });

    if (!collaborator) {
      throw new Error("Collaborator not found.");
    }

    const hasPassword =
      collaborator.password != null && String(collaborator.password).trim() !== "";

    if (!hasPassword) {
      return {
        needsPasswordSetup: true,
        phoneNumber: collaborator.phoneNumber ?? null,
        email: collaborator.email ?? null,
      };
    }

    const isPasswordCorrect = await helper.verifyPassword(
      password,
      collaborator.password
    );

    if (!isPasswordCorrect) {
      throw new Error("Invalid credentials.");
    }

    const jti = helper.generateRandomJti(16);
    await Collaborator.findByIdAndUpdate(collaborator._id, { $set: { jti } });

    const collaboratorObject = await Collaborator.findById(collaborator._id).lean();

    const payload = {
      _id: collaboratorObject._id,
      jti: collaboratorObject.jti,
      authKind: "collaborator",
    };

    const access_token = helper.generateToken(payload, "access");
    const refresh_token = helper.generateToken(payload, "refresh");

    const {
      password: _,
      jti: __,
      ...rest
    } = withProfessionAliases(collaboratorObject);

    return {
      needsPasswordSetup: false,
      collaborator: { ...rest, access_token, refresh_token },
    };
  } catch (error) {
    throw error;
  }
};

const deleteCollaborator = async (req) => {
  try {
    const { id } = req.params;
    const collaborator = await Collaborator.findByIdAndDelete(id);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }
    return withProfessionAliases(collaborator);
  } catch (error) {
    console.error("Delete Collaborator Error:", error);
    throw new Error(error.message || "Failed to delete collaborator");
  }
};

export const collaboratorService = {
  addCollaborator,
  updateCollaborator,
  getCollaboratorById: getCollaboratorByIdService,
  getCollaboratorMe,
  updateCollaboratorMe,
  getAllCollaborators: getAllCollaboratorsService,
  lookupCollaborator,
  setCollaboratorPassword,
  loginCollaborator,
  deleteCollaborator,
};
