import { apiController } from "./apiController";

export const logout = async () => {
  await apiController({
    url: '/api/v1/auth/logout',
    method: 'post',
  })

};
