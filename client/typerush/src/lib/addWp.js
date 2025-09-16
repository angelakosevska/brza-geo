import api from "@/lib/axios";

export async function addWP(userId, amount) {
  const res = await api.post(`/user/${userId}/addWP`, { amount });
  return res.data; // returns { wordPower, level }
}
