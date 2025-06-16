"use client";
import React from "react";
import { Card, CardMedia, CardContent, Typography, Grid, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ImageIcon from "@mui/icons-material/Image";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import relativeTime from "dayjs/plugin/relativeTime";
import BlindWrapper from "../BlindWrapper";

dayjs.extend(relativeTime);

interface FirstImageData {
  id: number;
  image_name: string;
  link: string;
  created_at: string;
}

interface TableRowData {
  id: number;
  title: string;
  imageFlag: boolean;
  videoFlag: boolean; // 동영상 존재 여부 플래그
  userId?: string; // 사용자 ID 추가 (블라인드 처리용)
  nickname: string;
  created_at: string;
  recommend_Count: number; // 좋아요 카운트는 optional
  firstImage?: FirstImageData; // Optional, 객체 형태
  isRecommendRanking?: boolean; // 추천 랭킹 여부
}

interface CustomizedCardViewProps {
  tableData: TableRowData[];
  onRowClick?: (postId: number) => void;
}

const CustomizedCardView = ({ tableData, onRowClick }: CustomizedCardViewProps): React.ReactElement => {
  const router = useRouter();
  return (
    <>
      {tableData.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "200px",
            width: "100%",
            border: "1px dashed #ccc",
            borderRadius: 2,
            p: 3,
            backgroundColor: "#f9f9f9",
          }}
        >
          <Typography variant="h5" gutterBottom>
            😊 게시글이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            첫 번째 게시글을 작성해보세요!
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={1} sx={{ p: 1 }}>
          {tableData.map((row) => (
            <Grid item xs={12} sm={6} md={4} key={row.id}>
              <Card
                elevation={4}
                onClick={() => {
                  // 현재 페이지 URL을 세션 스토리지에 저장
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem("previousMainPageUrl", window.location.href);
                  }
                  if (onRowClick) {
                    onRowClick(row.id);
                  } else {
                    // 기본 동작 (메인 페이지에서 사용될 때)
                    router.push(`/detail/${row.id}`);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": { transform: "scale(1.03)", boxShadow: 6 },
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                }}
              >
                {/* 상단: 제목 */}
                <CardContent sx={{ pb: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                      {row.isRecommendRanking && (
                        <EmojiEventsIcon
                          sx={{
                            fontSize: "1.2rem",
                            color: "#ff9800",
                            mr: 1,
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {row.imageFlag && (
                          <ImageIcon
                            sx={{
                              fontSize: "1.1rem",
                              verticalAlign: "middle",
                              color: "#10b981", // 에메랄드 그린
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              borderRadius: "4px",
                              padding: "2px",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 4px 8px rgba(16, 185, 129, 0.4)",
                              },
                            }}
                          />
                        )}
                        {row.videoFlag && (
                          <VideoLibraryIcon
                            sx={{
                              fontSize: "1.1rem",
                              verticalAlign: "middle",
                              color: "#ef4444", // 빨간색
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              borderRadius: "4px",
                              padding: "2px",
                              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 4px 8px rgba(239, 68, 68, 0.4)",
                              },
                            }}
                          />
                        )}
                        <Typography variant="h6" gutterBottom sx={{ wordBreak: "break-word" }}>
                          {row.userId ? (
                            <BlindWrapper userId={row.userId} type="post">
                              {row.title}
                            </BlindWrapper>
                          ) : (
                            row.title
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
                      <FavoriteIcon fontSize="small" sx={{ mr: 0.5, color: "error.main" }} />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {row.recommend_Count ?? 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                {/* 이미지 영역: imageFlag가 true이고 firstImage가 존재할 경우 렌더링 */}
                {row.imageFlag && row.firstImage ? (
                  <CardMedia
                    component="img"
                    width="360"
                    height="200"
                    image={`${process.env.NEXT_PUBLIC_BASE_URL}${row.firstImage.link}`}
                    alt={row.title}
                  />
                ) : row.videoFlag ? (
                  <Image src="/assets/Video.png" alt="Video" width={360} height={200} />
                ) : (
                  <Image src="/assets/NoImage.PNG" alt="No Image" width={360} height={200} />
                )}

                {/* 하단: 작성자, 번호 및 등록일 */}
                <CardContent sx={{ pt: 1, flexGrow: 1 }}>
                  <Typography variant="body2">작성자: {row.nickname}</Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      번호: {row.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(row.created_at).isSame(dayjs(), "day")
                        ? dayjs(row.created_at).format("HH:mm")
                        : dayjs(row.created_at).format("YYYY/MM/DD")}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
};

export default CustomizedCardView;
