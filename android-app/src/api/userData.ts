import { apiClient } from './client';

export const UserDataAPI = {
  /**
   * 标记/取消标记收藏
   */
  async toggleFavorite(userId: string, itemId: string, isFavorite: boolean): Promise<any> {
    if (isFavorite) {
      return apiClient.post(`/Users/${userId}/FavoriteItems/${itemId}`);
    } else {
      return apiClient.delete(`/Users/${userId}/FavoriteItems/${itemId}`);
    }
  },

  /**
   * 标记/取消标记已看
   */
  async togglePlayed(userId: string, itemId: string, isPlayed: boolean): Promise<any> {
    if (isPlayed) {
      return apiClient.post(`/Users/${userId}/PlayedItems/${itemId}`);
    } else {
      return apiClient.delete(`/Users/${userId}/PlayedItems/${itemId}`);
    }
  }
};
