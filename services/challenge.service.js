// services/challenge.service.js
import { v4 as uuidv4 } from "uuid";
import { createChallenge, deleteChallenge, getAllChallenges, getChallengeById, updateChallenge } from "../models/challenge.model.js";


export const addChallenge = async (data) => {
  if (!data.creator_id || !data.title || !data.description || !data.category) {
    throw new Error("creator_id, title, description, and category are required");
  }

  const challenge = {
    id: uuidv4(),
    creator_id: data.creator_id,
    title: data.title,
    description: data.description,
    category: data.category,
    entry_fee: data.entry_fee || 0,
    prize_amount: data.prize_amount || 0,
    visibility: data.visibility || "public",
    status: data.status || "draft",
    judging_mode: data.judging_mode || "creator",
    start_time: data.start_time || null,
    end_time: data.end_time || null,
  };

  await createChallenge(challenge);
  return { message: "Challenge created successfully", id: challenge.id };
};

export const fetchChallenge = async (id) => {
  const challenge = await getChallengeById(id);
  if (!challenge) throw new Error("Challenge not found");
  return challenge;
};

export const fetchAllChallenges = async () => {
  return await getAllChallenges();
};

export const modifyChallenge = async (id, updates) => {
  await updateChallenge(id, updates);
  return { message: "Challenge updated successfully" };
};

export const removeChallenge = async (id) => {
  await deleteChallenge(id);
  return { message: "Challenge deleted successfully" };
};
