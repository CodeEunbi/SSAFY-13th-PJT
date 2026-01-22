<template>
  <div class="full-page-wrapper">
    <nav class="navbar navbar-expand-sm navbar-dark">
      <div class="container-fluid">
        <RouterLink :to="{ name: 'landing-view' }" class="navbar-brand th">Th<span class="read">Read</span></RouterLink>

        <!-- <a class="navbar-brand th" href="#">Th<span class="read">Read</span></a> -->
        <button class="navbar-toggler btn-light" type="button" data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false"
          aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse text-end" id="navbarNavDropdown">
          <nav class="navbar-nav ms-auto">
            <RouterLink :to="{ name: 'threads-list' }" class="nav-link">쓰레드</RouterLink>
            <RouterLink :to="{ name: 'books-list' }" class="nav-link">도서 검색</RouterLink>

            <!-- 로그인 상태일 때 -->
            <template v-if="accountStore.isLogin && accountStore.user">
              <RouterLink :to="{ name: 'mypage', params: { userId: accountStore.user.id } }" class="nav-link">
                마이페이지
              </RouterLink>
              <a class="nav-link" @click="logout">로그아웃</a>
            </template>

            <!-- 로그인 안 했을 때 -->
            <template v-else>
              <RouterLink :to="{ name: 'login' }" class="nav-link">로그인</RouterLink>
              <RouterLink :to="{ name: 'signup' }" class="nav-link">회원가입</RouterLink>
            </template>

          </nav>
        </div>
      </div>
    </nav>
    <RouterView />
  </div>
</template>

<script setup>
import { useAccountStore } from '@/stores/accounts.js'
import { onMounted } from 'vue'

const accountStore = useAccountStore()

onMounted(async () => {
  if (accountStore.token) {
    await accountStore.fetchUser()
  }
  console.log('로그인 여부:', accountStore.isLogin)
  console.log('유저 정보:', accountStore.user)
})


function logout() {
  accountStore.token = ''
  accountStore.user = null
  console.log('로그아웃 후 로그인 여부:', accountStore.isLogin)
}
</script>

<style scoped>
.full-page-wrapper {
  width: 100vw;
  height: 100vh;
  background-color: #1c1c1e;
  color: white;
  overflow: auto;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 1050;
  /* Bootstrap navbar z-index 참고 */
  background-color: black;
}

.th {
  color: #fff;
  font-family: "GmarketSansTTFMedium";
}

.read {
  color: #fe4a51;
  font-family: "GmarketSansTTFMedium";
}

.nav-link {
  font-family: "SBAggro_L";
  color: #fff;
}
</style>