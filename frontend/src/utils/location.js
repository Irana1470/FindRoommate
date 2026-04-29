export const buildPhongAddress = phong => (
  phong?.diaChiDayDu || [phong?.diaChi, phong?.quanHuyen, phong?.tinhThanh].filter(Boolean).join(', ')
);
