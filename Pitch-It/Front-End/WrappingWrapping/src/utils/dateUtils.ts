export const formatToKoreanDateTime = (isoString: string): string => {
  const date = new Date(isoString);

  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const formatToKoreanDate = (isoString: string): string => {
  const date = new Date(isoString);

  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatToKoreanTime = (isoString: string): string => {
  const date = new Date(isoString);

  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${hour}:${minute}`;
};

// yyyy-mm-dd HH:mm:ss 형식의 문자열 반환
export const formatToKoreanDateTimeWithSeconds = (
  isoString: string,
): string => {
  const date = new Date(isoString);

  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
