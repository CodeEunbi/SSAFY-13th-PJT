<template>


  <section class="hero-section">
    <img src="@/assets/nav/hero_image.jpg" alt="Hero Image" class="hero-img" />
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1 class="hero-title">
        독서 감상평 공유 및 AI 기반 작가 챗봇 서비스
      </h1>
      <div class="hero-subtitle">ThRead</div>
    </div>
  </section>

  <div>
    <BestSellers class="best-sellers" />
    <CategoryBooks />
    <PopularThreads />
    <!-- <AIRecommendations /> -->
  </div>
</template>

<script setup>
import AIRecommendations from '@/components/landing-view/AIRecommendations.vue'
import BestSellers from '@/components/landing-view/BestSellers.vue'
import CategoryBooks from '@/components/landing-view/CategoryBooks.vue'
import PopularThreads from '@/components/landing-view/PopularThreads.vue'
</script>

<style scoped>
.hero-section {
  min-height: 80vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
}

.hero-section img.hero-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.hero-overlay {
  background: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 3;
}

.hero-title {
  font-family: "GmarketSansTTFMedium";
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: rgba(74, 74, 74, 0.6);
  border-radius: 0.2rem;
  padding: 0 1rem;
}

.hero-subtitle {
  font-weight: 700;
  font-size: 1.5rem;
}

.th {
  color: #fff;
  font-family: "GmarketSansTTFMedium";
}

.read {
  color: #fe4a51;
  font-family: "GmarketSansTTFMedium";
}

@media (max-width: 412px) {
  .d-412-block {
    display: block;
  }

}
</style>
