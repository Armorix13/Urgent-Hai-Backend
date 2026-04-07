import Collaborator from "../models/collaborator.model.js";

export const getCollaboratorById = async (id) => {
  return await Collaborator.findById(id);
};

export const getAllCollaborators = async () => {
  return await Collaborator.find().sort({ createdAt: -1 });
};

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

/** Responses include both keys; same stored string in `profession`. */
function withProfessionAliases(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  if (o.profession != null && o.profession !== "") {
    o.professionValue = o.profession;
  } else {
    o.professionValue = null;
  }
  return o;
}

const addCollaborator = async (req) => {
  try {
    const { name, profile, phoneNumber } = req.body;
    const profession = resolveProfessionFromBody(req.body);

    const newCollaborator = new Collaborator({
      name,
      profile,
      phoneNumber,
      profession,
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
    const { name, profile, phoneNumber } = req.body;

    const collaborator = await getCollaboratorById(id);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }

    if (name) collaborator.name = name;
    if (profile) collaborator.profile = profile;
    if (phoneNumber) collaborator.phoneNumber = phoneNumber;
    const nextProfession = resolveProfessionFromBody(req.body);
    if (nextProfession !== undefined) collaborator.profession = nextProfession;

    await collaborator.save();
    return withProfessionAliases(collaborator);
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
    
    return withProfessionAliases(collaborator);
  } catch (error) {
    console.error("Get Collaborator Error:", error);
    throw new Error(error.message || "Failed to get collaborator");
  }
};

const getAllCollaboratorsService = async (req) => {
  try {
    const collaborators = await getAllCollaborators();
    return collaborators.map((c) => withProfessionAliases(c));
  } catch (error) {
    console.error("Get All Collaborators Error:", error);
    throw new Error(error.message || "Failed to get collaborators");
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
  getAllCollaborators: getAllCollaboratorsService,
  deleteCollaborator,
};
