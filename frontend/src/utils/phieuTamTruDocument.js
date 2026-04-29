const CT01_NOTES = [
  '(1) Cơ quan đăng ký cư trú.',
  '(2) Ghi rõ ràng, cụ thể nội dung đề nghị. Ví dụ: đăng ký thường trú; đăng ký tạm trú; tách hộ; xác nhận thông tin về cư trú...',
  '(3) Áp dụng đối với các trường hợp quy định tại khoản 2, khoản 3, khoản 5, khoản 6 Điều 20; khoản 1 Điều 25; điểm a khoản 1 Điều 26 Luật Cư trú. Việc lấy ý kiến của chủ hộ được thực hiện theo các phương thức sau: a) Chủ hộ ghi rõ nội dung đồng ý và ký, ghi rõ họ tên vào Tờ khai. b) Chủ hộ xác nhận nội dung đồng ý thông qua ứng dụng VNeID hoặc các dịch vụ công trực tuyến khác. c) Chủ hộ có văn bản riêng ghi rõ nội dung đồng ý (văn bản này không phải công chứng, chứng thực).',
  '(4) Áp dụng đối với các trường hợp quy định tại khoản 2, khoản 3, khoản 4, khoản 5, khoản 6 Điều 20; khoản 1 Điều 25 Luật Cư trú; điểm a khoản 1 Điều 26 Luật Cư trú. Việc lấy ý kiến của chủ sở hữu chỗ ở hợp pháp được thực hiện theo các phương thức sau: a) Chủ sở hữu chỗ ở hợp pháp ghi rõ nội dung đồng ý và ký, ghi rõ họ tên vào Tờ khai. b) Chủ sở hữu chỗ ở hợp pháp xác nhận nội dung đồng ý thông qua ứng dụng VNeID hoặc các dịch vụ công trực tuyến khác. c) Chủ sở hữu chỗ ở hợp pháp có văn bản riêng ghi rõ nội dung đồng ý (văn bản này không phải công chứng, chứng thực). Ghi chú: Trường hợp chủ sở hữu chỗ ở hợp pháp gồm nhiều cá nhân, tổ chức thì phải có ý kiến đồng ý của tất cả các đồng sở hữu, trừ trường hợp đã có thỏa thuận về việc cử đại diện có ý kiến đồng ý; trường hợp chủ sở hữu chỗ ở hợp pháp xác nhận nội dung đồng ý thông qua ứng dụng VNeID thì công dân phải kê khai thông tin về họ, chữ đệm, tên và số ĐDCN của chủ sở hữu chỗ ở hợp pháp.',
  '(5) Áp dụng đối với trường hợp người chưa thành niên, người hạn chế hành vi dân sự, người không đủ năng lực hành vi dân sự có thay đổi thông tin về cư trú. Việc lấy ý kiến của cha, mẹ hoặc người giám hộ được thực hiện theo các phương thức sau: a) Cha, mẹ hoặc người giám hộ ghi rõ nội dung đồng ý và ký, ghi rõ họ tên vào Tờ khai. b) Cha, mẹ hoặc người giám hộ xác nhận nội dung đồng ý thông qua ứng dụng VNeID hoặc các dịch vụ công trực tuyến khác. c) Cha, mẹ hoặc người giám hộ có văn bản riêng ghi rõ nội dung đồng ý (văn bản này không phải công chứng, chứng thực).',
  '(6) Trường hợp nộp trực tiếp, người kê khai ký, ghi rõ họ, chữ đệm và tên vào Tờ khai. Trường hợp nộp qua cổng dịch vụ công hoặc ứng dụng VNeID thì người kê khai không phải ký vào mục này.',
  '(7) Chỉ kê khai thông tin khi công dân đề nghị xác nhận nội dung đồng ý thông qua ứng dụng VNeID.',
];

const normalizeText = value => (value ?? '').toString().trim();

const parseDate = value => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const formatDateVN = value => {
  const parsed = parseDate(value);
  return parsed ? new Intl.DateTimeFormat('vi-VN').format(parsed) : '';
};

export const formatDateWords = value => {
  const parsed = parseDate(value);
  if (!parsed) return '....., ngày ..... tháng ..... năm .....';
  return `....., ngày ${parsed.getDate()} tháng ${parsed.getMonth() + 1} năm ${parsed.getFullYear()}`;
};

export const splitDateParts = value => {
  const parsed = parseDate(value);
  if (!parsed) {
    return { day: '', month: '', year: '' };
  }

  return {
    day: String(parsed.getDate()).padStart(2, '0'),
    month: String(parsed.getMonth() + 1).padStart(2, '0'),
    year: String(parsed.getFullYear()),
  };
};

export const buildNoiDungDeNghi = rawData => {
  const diaChiTamTru = normalizeText(rawData?.diaChiTamTru);
  const noiDangKy = diaChiTamTru;
  const ngayBatDau = formatDateVN(rawData?.ngayBatDau);

  if (!noiDangKy && !ngayBatDau) {
    return 'Đăng ký tạm trú.';
  }

  if (!ngayBatDau) {
    return `Đăng ký tạm trú tại ${noiDangKy}.`;
  }

  if (!noiDangKy) {
    return `Đăng ký tạm trú từ ngày ${ngayBatDau}.`;
  }

  return `Đăng ký tạm trú tại ${noiDangKy} từ ngày ${ngayBatDau}.`;
};

export const buildCt01PreviewData = rawData => {
  const source = rawData || {};

  return {
    ...source,
    coQuanDangKy: normalizeText(source.coQuanDangKy),
    hoTen: normalizeText(source.hoTen),
    gioiTinh: normalizeText(source.gioiTinh),
    soDienThoai: normalizeText(source.soDienThoai),
    email: normalizeText(source.email),
    soCanCuocCongDan: normalizeText(source.soCanCuocCongDan),
    diaChiThuongTru: normalizeText(source.diaChiThuongTru),
    diaChiTamTru: normalizeText(source.diaChiTamTru),
    tenChuHo: normalizeText(source.tenChuHo),
    quanHeVoiChuHo: normalizeText(source.quanHeVoiChuHo),
    soDinhDanhChuHo: normalizeText(source.soDinhDanhChuHo),
    tenPhong: normalizeText(source.tenPhong),
    ngaySinhParts: splitDateParts(source.ngaySinh),
    ngaySinhText: formatDateVN(source.ngaySinh),
    ngayBatDauParts: splitDateParts(source.ngayBatDau),
    ngayBatDauText: formatDateVN(source.ngayBatDau),
    ngayKyText: formatDateWords(source.ngayBatDau),
    noiDungDeNghi: normalizeText(source.noiDungDeNghi) || buildNoiDungDeNghi(source),
  };
};

export const buildCt01FileName = (rawData, extension = 'pdf') => {
  const data = buildCt01PreviewData(rawData);
  const safeName = (data.hoTen || `phieu-${data.maPhieuTamTru || 'tam-tru'}`)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `CT01-${safeName || 'findroommate'}.${extension}`;
};

export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export { CT01_NOTES };
