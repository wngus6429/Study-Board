import axios from "./axios";
import { IBlindUser, IBlindRequest, IBlindListResponse } from "../types/blind";

// 사용자 블라인드 추가
export const addBlindUser = async (request: IBlindRequest): Promise<IBlindUser> => {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/blinds`, request, {
    withCredentials: true,
  });
  return response.data;
};

// 블라인드 목록 조회
export const getBlindUsers = async (page: number = 1, limit: number = 20): Promise<IBlindListResponse> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/blinds`, {
    params: { page, limit },
    withCredentials: true,
  });
  return response.data;
};

// 블라인드 해제
export const removeBlindUser = async (blindId: number): Promise<void> => {
  await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/blinds/${blindId}`, {
    withCredentials: true,
  });
};

// 특정 사용자가 블라인드되어 있는지 확인
export const isUserBlinded = async (userId: string): Promise<boolean> => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/blinds/check/${userId}`, {
      withCredentials: true,
    });
    return response.data.isBlinded;
  } catch (error) {
    return false;
  }
};
