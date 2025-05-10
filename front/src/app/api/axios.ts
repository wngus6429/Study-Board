import axios from 'axios';

// axios 인스턴스 생성
// withCredentials: true로 설정하여 쿠키가 요청에 포함되도록 함
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
});

// 요청 인터셉터: 모든 API 요청이 서버로 전송되기 전에 실행됨
instance.interceptors.request.use(
  (config) => {
    console.log('API 요청 시작:', config.url);
    return config;
  },
  (error) => {
    console.log('API 요청 에러:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 서버로부터 응답을 받은 후 실행됨
instance.interceptors.response.use(
  // 성공적인 응답 처리
  (response) => {
    console.log('API 응답 성공:', response.config.url);
    return response;
  },
  // 에러 응답 처리
  async (error) => {
    console.log('API 응답 에러:', error.config?.url, error.response?.status);
    const originalRequest = error.config;

    // 리프레시 토큰 요청 자체가 실패한 경우
    // 이 경우는 무한 루프를 방지하기 위해 바로 로그인 페이지로 이동
    if (originalRequest.url === '/api/auth/refresh') {
      console.log('리프레시 토큰 요청 실패, 로그인 페이지로 이동');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 401 에러(인증 실패)이고, 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('액세스 토큰 만료, 리프레시 토큰으로 갱신 시도');
      originalRequest._retry = true; // 재시도 플래그 설정

      try {
        // 리프레시 토큰을 사용하여 새로운 액세스 토큰 요청
        console.log('리프레시 토큰으로 새로운 액세스 토큰 요청');
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/refresh`,
          {}, // 빈 body
          { 
            withCredentials: true, // 쿠키 포함
            headers: {
              'Content-Type': 'application/json' // JSON 형식 명시
            }
          }
        );
        console.log('새로운 액세스 토큰 발급 성공:', refreshResponse.status);

        // 새로운 액세스 토큰이 발급되면 원래 요청을 재시도
        console.log('원래 요청 재시도:', originalRequest.url);
        return instance(originalRequest);
      } catch (refreshError) {
        // 리프레시 토큰도 만료되었거나 유효하지 않은 경우
        console.log('리프레시 토큰 갱신 실패:', refreshError);
        // 로그인 페이지로 이동
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 401 에러가 아니거나 이미 재시도한 요청인 경우 에러 그대로 반환
    return Promise.reject(error);
  }
);

export default instance; 