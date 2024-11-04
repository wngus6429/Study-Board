// 현재 날짜 객체 생성
export const Today = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
  const day = String(now.getDate()).padStart(2, '0');
  // YYYYMMDD 형식의 날짜 문자열 생성
  return `${year}${month}${day}`;
};
