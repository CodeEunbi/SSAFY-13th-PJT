export const $ = (selector: string) => {
  const result = document.querySelector(selector);

  if (!(result instanceof HTMLElement)) return null;

  return result;
}

/** Usage
 * $('#myId') // ID
 * $('.myClass') // 클래스
 * $('div') // 태그
 * $('[data-role="button"]') // 속성
 * $('.container .item:first-child') // 복합 선택자
 * 
 * ! 첫 번째 요소만 가져오는 것이기 때문에 ID 위주로 사용하기
 * ! 백에서 고칠 텍스트 넘어올 때 사용하면 될 듯
 * ! const allDivs = document.querySelectorAll('div'); // 여러 요소 선택
 */
