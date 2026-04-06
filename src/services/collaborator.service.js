import Collaborator from "../models/collaborator.model.js";
import { professionNumberToKey } from "../utils/enum.js";

export const getCollaboratorById = async (id) => {
  return await Collaborator.findById(id);
};

export const getAllCollaborators = async () => {
  return await Collaborator.find().sort({ createdAt: -1 });
};

function withProfessionValue(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.professionValue = professionNumberToKey(o.profession);
  return o;
}

const addCollaborator = async (req) => {
  try {
    const { name, profile, phoneNumber, profession } = req.body;

    const newCollaborator = new Collaborator({
      name,
      profile,
      phoneNumber,
      profession,
    });

    await newCollaborator.save();
    return withProfessionValue(newCollaborator);
  } catch (error) {
    console.error("Add Collaborator Error:", error);
    throw new Error(error.message || "Failed to add collaborator");
  }
};

const updateCollaborator = async (req) => {
  try {
    const { id } = req.params;
    const { name, profile, phoneNumber, profession } = req.body;

    const collaborator = await getCollaboratorById(id);
    if (!collaborator) {
      throw new Error("Collaborator not found");
    }

    if (name) collaborator.name = name;
    if (profile) collaborator.profile = profile;
    if (phoneNumber) collaborator.phoneNumber = phoneNumber;
    if (profession) collaborator.profession = profession;

    await collaborator.save();
    return withProfessionValue(collaborator);
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
    
    return withProfessionValue(collaborator);
  } catch (error) {
    console.error("Get Collaborator Error:", error);
    throw new Error(error.message || "Failed to get collaborator");
  }
};

const getAllCollaboratorsService = async (req) => {
  try {
    const collaborators = await getAllCollaborators();
    return collaborators.map((c) => withProfessionValue(c));
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
    return withProfessionValue(collaborator);
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
