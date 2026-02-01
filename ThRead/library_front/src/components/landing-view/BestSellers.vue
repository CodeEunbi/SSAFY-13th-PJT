<template>
  <section class="bestseller py-5 w-60 w-md-60">
    <div class="container bestseller-container w-md-60 ">
      <div class="row">
        <div class="col-3 ">
          <h3 class="section-title text-center" style="line-height: 250px">베스트셀러</h3>
        </div>
        <!-- 
          [과제 안내]
          아래 영역에 Bootstrap Carousel 컴포넌트를 이용해
          - 총 12권의 도서를 4권씩 나눈 슬라이드를 구현하고,
          - 각 도서는 도서 커버 이미지와 제목으로 구성하며,
          - 우측에만 표시되는 Next 컨트롤 버튼을 포함하도록 작성하세요.
        -->
        <!-- 코드는 여기에 작성하시오 -->
        <div class="col-9">
          <div id="carousel-bestsellers" class="carousel slide">
            <div class="carousel-inner">
              <div class="carousel-item active">
                <div class="row">
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img1.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">소년이 온다</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img2.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">채식주의자</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img3.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">대온실 수리 보고서</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img4.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">급류</p>
                  </div>
                </div>
              </div>
              <div class="carousel-item">
                <div class="row">
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img5.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">시간의 계곡</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img6.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">인간 실격</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img7.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">노르웨이의 숲</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img8.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">정원에 대하여</p>
                  </div>
                </div>
              </div>
              <div class="carousel-item">
                <div class="row">
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img9.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">네 칼이 센가, 내 칼이 센가</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img10.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">새벽의 사원</p>
                  </div> 
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img11.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">위싱 머신</p>
                  </div>
                  <div class="col-3">
                    <img src="@/assets/bestsellers/img12.jpeg" class="d-block bestseller-img" alt="...">
                    <p class="book-title">모순</p>
                  </div>
                </div>
              </div>
              <button id="btn_right" class="carousel-control-next bg-danger bg-opacity-8 rounded-circle align-self-center"
                type="button" data-bs-target="#carousel-bestsellers" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
              </button>
            </div>

          </div>
        </div>
      </div>




    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const carouselElement = document.querySelector('#carousel-bestsellers')
  const carousel = new bootstrap.Carousel(carouselElement)

  document.querySelector('#btn_right')?.addEventListener('click', () => {
    carousel.next()
  })
})
</script>
<style scoped>
    /* 폰트 정의 */
    @font-face {
      font-family: 'SBAggro_L';
      src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2108@1.1/SBAggroL.woff') format('woff');
      font-weight: normal;
      font-style: normal;
    }

    @font-face {
      font-family: 'GmarketSansTTFMedium';
      src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff') format('woff');
      font-weight: normal;
      font-style: normal;
    }

    body {
      margin: 0;
      padding: 0;
      color: #333;
      font-family: "Helvetica Neue", Arial, sans-serif;
    }

    .section-title {
      font-family: "GmarketSansTTFMedium";
    }

    .bestseller-img {
      width: 150px;
      height: 220px;
    }

    .book-title {
      width: 150px;
      font-size: 12px;
      margin: 0;
      text-align: center;
    }

    .carousel-control-next {
      width: 40px;
      height: 40px;
      padding: 10px;
    }
</style>