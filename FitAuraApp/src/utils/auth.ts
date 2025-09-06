// Simple auth utility using browser cookies

export const setLoginCookie = (userId: string) => {
  document.cookie = `user_id=${userId}; path=/; max-age=${60 * 60 * 24}`; // 1 day
};

export const getLoginCookie = (): string | null => {
  const match = document.cookie.match(new RegExp('(^| )user_id=([^;]+)'));
  return match ? match[2] : null;
};

export const clearLoginCookie = () => {
  document.cookie = 'user_id=; path=/; max-age=0';
};
