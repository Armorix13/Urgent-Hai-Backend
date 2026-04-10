import Section from "../models/section.model.js";
import Collaborator from "../models/collaborator.model.js";

function normalizeContentItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((c, i) => ({
    title: c.title,
    url: c.url,
    description: c.description ?? undefined,
    thumbnail: c.thumbnail ?? undefined,
    duration: c.duration ?? undefined,
    order: c.order != null ? c.order : i,
  }));
}

const upsertSection = async (req) => {
  const {
    sectionId,
    collaboratorId,
    title,
    description,
    content,
    isActive,
    order,
  } = req.body;

  const collaborator = await Collaborator.findById(collaboratorId);
  if (!collaborator) {
    throw new Error("Collaborator not found");
  }

  if (sectionId) {
    const section = await Section.findById(sectionId);
    if (!section) {
      throw new Error("Section not found");
    }
    if (section.collaboratorId.toString() !== String(collaboratorId)) {
      throw new Error("Section does not belong to this collaborator");
    }
    section.title = title;
    if (description !== undefined) section.description = description;
    if (content !== undefined) section.content = normalizeContentItems(content);
    if (isActive !== undefined) section.isActive = isActive;
    if (order !== undefined) section.order = order;
    await section.save();
    return section.toObject();
  }

  const created = await Section.create({
    collaboratorId,
    title,
    description: description ?? undefined,
    content: normalizeContentItems(content ?? []),
    isActive: isActive !== undefined ? isActive : true,
    order: order ?? 0,
  });
  return created.toObject();
};

const getSectionById = async (req) => {
  const { id } = req.params;
  const section = await Section.findById(id)
    .populate("collaboratorId", "name profile coverProfile email phoneNumber profession address")
    .lean();
  if (!section) {
    throw new Error("Section not found");
  }
  return section;
};

const getSectionsByCollaboratorId = async (req) => {
  const { collaboratorId } = req.params;
  const collaborator = await Collaborator.findById(collaboratorId).select("_id").lean();
  if (!collaborator) {
    throw new Error("Collaborator not found");
  }
  const sections = await Section.find({ collaboratorId })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return { sections };
};

const deleteSection = async (req) => {
  const { id } = req.params;
  const section = await Section.findByIdAndDelete(id);
  if (!section) {
    throw new Error("Section not found");
  }
  return section.toObject();
};

export const sectionService = {
  upsertSection,
  getSectionById,
  getSectionsByCollaboratorId,
  deleteSection,
};
