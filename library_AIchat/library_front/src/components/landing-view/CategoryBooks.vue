<template>
  <section class="genre-section py-5">
    <div class="container">
      <h3 class="section-title text-center mb-4">장르별 도서 목록</h3>
      <div class="genre-grid">
        <div
          class="genre-card"
          v-for="genre in genres"
          :key="genre.name"
        >
          <img
            :src="getImageUrl(genre.image)"
            class="genre-img"
            :alt="genre.name"
          >
          <div class="genre-label">{{ genre.name }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// 장르 배열
const genres = [
  { name: '소설/시/희곡', image: 'history.jpg' },
  { name: '경제/경영', image: 'economy.jpg' },
  { name: '자기계발', image: 'youth.jpg' },
  { name: '인문/교양', image: 'philosophy.jpg' },
  { name: '취미/실용', image: 'travel.jpg' },
  { name: '어린이/청소년', image: 'baby.jpg' },
  { name: '과학', image: 'natural_science.jpg' },
]

const getImageUrl = (filename) => {
  return new URL(`/src/assets/genre/${filename}`, import.meta.url).href
}
</script>

<style scoped>
.section-title {
  font-family: 'GmarketSansTTFMedium';
}

.genre-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.genre-card {
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
}

.genre-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.genre-label {
  position: absolute;
  bottom: 8px;
  left: 10px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  padding: 2px 6px;
  border-radius: 6px;
}
</style>
