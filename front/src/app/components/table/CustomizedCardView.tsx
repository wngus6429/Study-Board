"use client";
import React from "react";
import { Card, CardMedia, CardContent, Typography, Grid, Box } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  nickname: string;
  created_at: string;
  recommend_Count: number; // 좋아요 카운트는 optional
  firstImage?: FirstImageData; // Optional, 객체 형태
}

interface CustomizedCardViewProps {
  tableData: TableRowData[];
}

const CustomizedCardView = ({ tableData }: CustomizedCardViewProps): React.ReactElement => {
  const router = useRouter();
  return (
    <Grid container spacing={1} sx={{ p: 1 }}>
      {tableData.map((row) => (
        <Grid item xs={12} sm={6} md={4} key={row.id}>
          <Card
            elevation={4}
            onClick={() => router.push(`/detail/story/${row.id}`)}
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
                <Typography variant="h6" gutterBottom sx={{ flex: 1, wordBreak: "break-word" }}>
                  {row.title}
                </Typography>
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
  );
};

export default CustomizedCardView;
