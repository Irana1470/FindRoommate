package com.roommate.service;

import com.roommate.dto.XacThucDTO;
import com.roommate.model.NguoiDung;
import com.roommate.model.XacThucDanhTinh;
import com.roommate.repository.NguoiDungRepository;
import com.roommate.repository.XacThucDanhTinhRepository;
import com.roommate.security.PersonalDataCryptoService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.LuminanceSource;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrService {

    private static final class IdentityEvidence {
        private final String source;
        private final String citizenId;
        private final String fullName;
        private final LocalDate dateOfBirth;

        private IdentityEvidence(String source, String citizenId, String fullName, LocalDate dateOfBirth) {
            this.source = source;
            this.citizenId = citizenId;
            this.fullName = fullName;
            this.dateOfBirth = dateOfBirth;
        }
    }

    private static final Pattern DATE_PATTERN = Pattern.compile("(\\d{1,2})[/\\-.](\\d{1,2})[/\\-.](\\d{4})");
    private static final Pattern CITIZEN_ID_CANDIDATE_PATTERN =
            Pattern.compile("(?<!\\d)(\\d(?:[\\s.:-]?\\d){8,13})(?!\\d)");
    private static final Pattern OCR_DIGITISH_CANDIDATE_PATTERN =
            Pattern.compile("(?i)(?<![\\p{Alnum}])([0-9oilsbzqg](?:[\\s.:-]?[0-9oilsbzqg]){8,13})(?![\\p{Alnum}])");
    private static final Pattern QR_CITIZEN_ID_PATTERN = Pattern.compile("(?<!\\d)(\\d{9}|\\d{12})(?!\\d)");
    private static final List<Integer> PAGE_SEGMENTATION_MODES = List.of(6, 11);
    private static final List<Integer> DIGIT_PAGE_SEGMENTATION_MODES = List.of(7, 8, 13, 6);
    private static final String DIGIT_OCR_WHITELIST = "0123456789OILSBZQG:-. ";
    private static final int MAX_OCR_IMAGE_DIMENSION = 2200;
    private static final int MIN_OCR_IMAGE_DIMENSION = 900;
    private static final int TARGET_DIGIT_CROP_WIDTH = 1600;
    private static final int TARGET_DIGIT_CROP_HEIGHT = 260;
    private static final List<String> FULL_NAME_LABELS = List.of(
            "ho, chu dem va ten khai sinh",
            "ho chu dem va ten khai sinh",
            "ho va ten",
            "ho ten",
            "full name",
            "surname, middle and given name"
    );
    private static final List<String> DATE_OF_BIRTH_LABELS = List.of(
            "ngay, thang, nam sinh",
            "ngay thang nam sinh",
            "ngay sinh",
            "date of birth"
    );
    private static final List<String> CITIZEN_ID_LABELS = List.of(
            "so dinh danh ca nhan",
            "personal identification",
            "identity number",
            "id no",
            "so/no"
    );
    private static final List<String> ADDRESS_LABELS = List.of(
            "noi thuong tru",
            "que quan",
            "place of residence",
            "place of origin"
    );
    private static final List<String> NON_NAME_KEYWORDS = List.of(
            "can cuoc",
            "cong dan",
            "quoc tich",
            "nationality",
            "gioi tinh",
            "sex",
            "que quan",
            "noi thuong tru",
            "date of birth",
            "ngay sinh"
    );

    private final NguoiDungRepository nguoiDungRepo;
    private final XacThucDanhTinhRepository xacThucRepo;
    private final PersonalDataCryptoService personalDataCryptoService;

    @Value("${app.cccd.ocr.tessdata-path:${tesseract.data.path:}}")
    private String configuredTessDataPath;

    @Value("${app.cccd.ocr.primary-language:vie}")
    private String primaryLanguage;

    @Value("${app.cccd.ocr.fallback-language:}")
    private String fallbackLanguage;

    @Transactional
    public XacThucDTO xacThucCCCD(Integer maNguoiDung, MultipartFile matTruoc, MultipartFile matSau)
            throws IOException, TesseractException {
        validateImage(matTruoc, "mat truoc");
        validateImage(matSau, "mat sau");

        NguoiDung nd = nguoiDungRepo.findById(maNguoiDung)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        BufferedImage imgTruoc = toRgbImage(readImage(matTruoc, "mat truoc"));
        BufferedImage imgSau = toRgbImage(readImage(matSau, "mat sau"));

        Path tessDataPath = resolveTessDataPath();
        Tesseract tesseract = createTesseract(tessDataPath);

        List<String> ocrTexts = new ArrayList<>();
        long startedAt = System.currentTimeMillis();
        IdentityEvidence qrEvidence = extractIdentityEvidenceFromQr(imgTruoc, imgSau);
        List<String> frontTexts = new ArrayList<>();
        List<String> backTexts = new ArrayList<>();

        frontTexts.addAll(doCitizenIdOcrWithOrientations(tesseract, imgTruoc, true));
        frontTexts.addAll(doOcrWithOrientationVariants(tesseract, imgTruoc, true));
        if (!hasSufficientIdentityData(frontTexts, qrEvidence)) {
            backTexts.addAll(doCitizenIdOcrWithOrientations(tesseract, imgSau, false));
        }
        if (!hasSufficientIdentityData(frontTexts, qrEvidence) && qrEvidence == null) {
            backTexts.addAll(doOcrWithOrientationVariants(tesseract, imgSau, true));
        }
        if (qrEvidence != null) {
            if (qrEvidence.citizenId != null) {
                frontTexts.add("SO DINH DANH CA NHAN: " + qrEvidence.citizenId);
                backTexts.add("SO DINH DANH CA NHAN: " + qrEvidence.citizenId);
            }
            if (qrEvidence.fullName != null) {
                frontTexts.add("HO VA TEN: " + qrEvidence.fullName);
                backTexts.add("HO VA TEN: " + qrEvidence.fullName);
            }
            if (qrEvidence.dateOfBirth != null) {
                String qrDate = String.format(
                        "%02d/%02d/%04d",
                        qrEvidence.dateOfBirth.getDayOfMonth(),
                        qrEvidence.dateOfBirth.getMonthValue(),
                        qrEvidence.dateOfBirth.getYear()
                );
                frontTexts.add("NGAY SINH: " + qrDate);
                backTexts.add("NGAY SINH: " + qrDate);
            }
        }
        ocrTexts.addAll(frontTexts);
        ocrTexts.addAll(backTexts);
        ocrTexts = ocrTexts.stream().distinct().toList();
        String textTruoc = chooseBestOcrText(ocrTexts);
        if (textTruoc == null || textTruoc.isBlank()) {
            throw new RuntimeException("Không đọc được thông tin từ ảnh CCCD/CMND");
        }

        IdentityEvidence frontEvidence = extractIdentityEvidenceFromTexts("mat_truoc", frontTexts);
        IdentityEvidence rawBackEvidence = extractIdentityEvidenceFromTexts("mat_sau", backTexts);
        IdentityEvidence backEvidence = rawBackEvidence == null
                ? null
                : new IdentityEvidence(
                        rawBackEvidence.source,
                        null,
                        rawBackEvidence.fullName,
                        rawBackEvidence.dateOfBirth
                );
        Map<String, Integer> citizenIdCandidates = collectCitizenIdCandidates(ocrTexts);
        String soCanCuocCongDan = resolveCitizenId(frontEvidence, backEvidence, qrEvidence, citizenIdCandidates);
        String hoTen = resolveFullName(frontEvidence, backEvidence, qrEvidence);
        LocalDate ngaySinh = resolveDateOfBirth(frontEvidence, backEvidence, qrEvidence);
        String diaChi = trichXuatDiaChi(ocrTexts);

        log.info(
                "OCR CCCD maNguoiDung={} elapsedMs={} soCanCuoc={} hoTen={} ngaySinh={} diaChi={} textSnippet={}",
                maNguoiDung,
                System.currentTimeMillis() - startedAt,
                maskCitizenId(soCanCuocCongDan),
                hoTen,
                ngaySinh,
                diaChi,
                summarizeText(textTruoc)
        );
        if (soCanCuocCongDan == null) {
            log.warn("OCR CCCD khong trich xuat duoc so can cuoc. topCandidates={}", summarizeCandidateScores(citizenIdCandidates));
        }

        validateExtractedIdentity(soCanCuocCongDan, hoTen, ngaySinh);
        validateFrontBackConsistency(frontEvidence, backEvidence, qrEvidence, soCanCuocCongDan, hoTen, ngaySinh);
        String soCanCuocCongDanHash = personalDataCryptoService.hashCitizenId(soCanCuocCongDan);
        validateCitizenIdNotUsedByAnotherUser(soCanCuocCongDan, soCanCuocCongDanHash, maNguoiDung);

        XacThucDanhTinh xac = xacThucRepo.findByNguoiDung_MaNguoiDung(maNguoiDung)
                .orElse(XacThucDanhTinh.builder().nguoiDung(nd).build());
        xac.setHoTen(hoTen);
        xac.setSoCanCuocCongDanHash(soCanCuocCongDanHash);
        xac.setNgaySinh(ngaySinh);
        if (diaChi != null && !diaChi.isBlank()) {
            xac.setDiaChi(diaChi);
        }
        xac.setMoTa(textTruoc.substring(0, Math.min(textTruoc.length(), 500)));
        try {
            xacThucRepo.saveAndFlush(xac);
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException("Căn cước này đã được dùng để xác thực cho tài khoản khác.", ex);
        }

        nd.setXacThuc(true);
        nguoiDungRepo.save(nd);

        return XacThucDTO.builder()
                .hoTen(hoTen)
                .ngaySinh(ngaySinh != null ? ngaySinh.toString() : null)
                .diaChi(diaChi)
                .xacThucThanhCong(true)
                .thongBao("Ảnh CCCD chỉ được dùng tạm thời để OCR và không được lưu lại")
                .build();
    }

    private BufferedImage readImage(MultipartFile file, String fieldName) throws IOException {
        byte[] fileBytes = file.getBytes();
        try (InputStream inputStream = new ByteArrayInputStream(fileBytes)) {
            BufferedImage image = ImageIO.read(inputStream);
            if (image == null) {
                throw new RuntimeException("Không đọc được ảnh " + fieldName);
            }
            int orientation = readExifOrientation(fileBytes);
            BufferedImage normalizedImage = applyExifOrientation(image, orientation);
            log.debug(
                    "OCR image {} size={}x{} orientation={} normalized={}x{}",
                    fieldName,
                    image.getWidth(),
                    image.getHeight(),
                    orientation,
                    normalizedImage.getWidth(),
                    normalizedImage.getHeight()
            );
            return normalizedImage;
        }
    }

    private int readExifOrientation(byte[] fileBytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(fileBytes));
            ExifIFD0Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (directory == null || !directory.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                return 1;
            }
            return directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
        } catch (Exception ex) {
            log.debug("Khong doc duoc EXIF orientation: {}", ex.getMessage());
            return 1;
        }
    }

    private BufferedImage prepareImageForOcr(BufferedImage image) {
        BufferedImage rgbImage = toRgbImage(image);
        int maxDimension = Math.max(rgbImage.getWidth(), rgbImage.getHeight());
        if (maxDimension > MAX_OCR_IMAGE_DIMENSION) {
            return scaleImage(rgbImage, (double) MAX_OCR_IMAGE_DIMENSION / maxDimension);
        }
        if (maxDimension < MIN_OCR_IMAGE_DIMENSION) {
            return scaleImage(rgbImage, (double) MIN_OCR_IMAGE_DIMENSION / maxDimension);
        }

        return rgbImage;
    }

    private BufferedImage enhanceImageForOcr(BufferedImage image) {
        BufferedImage rgbImage = toRgbImage(image);
        BufferedImage sharpened = sharpenImage(rgbImage);
        BufferedImage contrasted = adjustContrast(sharpened, 1.15f);
        return toGrayscale(contrasted);
    }

    private IdentityEvidence extractIdentityEvidenceFromQr(BufferedImage... images) {
        for (BufferedImage image : images) {
            if (image == null) {
                continue;
            }
            String qrText = decodeQrText(image);
            if (qrText == null || qrText.isBlank()) {
                continue;
            }
            IdentityEvidence qrEvidence = extractIdentityEvidenceFromQrText(qrText);
            if (qrEvidence != null && qrEvidence.citizenId != null) {
                log.info(
                        "QR CCCD trich xuat duoc so can cuoc={} hoTen={} ngaySinh={}",
                        maskCitizenId(qrEvidence.citizenId),
                        qrEvidence.fullName,
                        qrEvidence.dateOfBirth
                );
                return qrEvidence;
            }
        }
        return null;
    }

    private String decodeQrText(BufferedImage image) {
        for (BufferedImage orientationVariant : buildOrientationVariants(image)) {
            for (BufferedImage candidate : buildQrScanCandidates(orientationVariant)) {
                try {
                    LuminanceSource source = new BufferedImageLuminanceSource(candidate);
                    BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
                    Map<DecodeHintType, Object> hints = new HashMap<>();
                    hints.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
                    hints.put(DecodeHintType.POSSIBLE_FORMATS, Collections.singletonList(BarcodeFormat.QR_CODE));
                    Result result = new MultiFormatReader().decode(bitmap, hints);
                    if (result != null && result.getText() != null && !result.getText().isBlank()) {
                        return result.getText();
                    }
                } catch (Exception ignored) {
                    // thử candidate tiếp theo
                }
            }
        }
        return null;
    }

    private List<BufferedImage> buildQrScanCandidates(BufferedImage image) {
        List<BufferedImage> candidates = new ArrayList<>();
        candidates.add(prepareImageForOcr(image));
        candidates.add(cropImage(image, 0.55d, 0.45d, 0.42d, 0.48d));
        candidates.add(cropImage(image, 0.50d, 0.35d, 0.46d, 0.56d));
        candidates.add(cropImage(image, 0.45d, 0.20d, 0.50d, 0.65d));
        return candidates;
    }

    private IdentityEvidence extractIdentityEvidenceFromQrText(String qrText) {
        if (qrText == null || qrText.isBlank()) {
            return null;
        }

        String citizenId = null;
        Matcher directMatcher = QR_CITIZEN_ID_PATTERN.matcher(qrText);
        while (directMatcher.find()) {
            String candidate = directMatcher.group(1);
            if (isLikelyCitizenId(candidate)) {
                citizenId = candidate;
                break;
            }
        }

        if (citizenId == null) {
            String normalizedDigits = qrText.replaceAll("\\D", "");
            if (normalizedDigits.length() >= 12) {
                for (int startIndex = 0; startIndex <= normalizedDigits.length() - 12; startIndex++) {
                    String candidate = normalizedDigits.substring(startIndex, startIndex + 12);
                    if (isLikelyCitizenId(candidate)) {
                        citizenId = candidate;
                        break;
                    }
                }
            }
            if (citizenId == null && normalizedDigits.length() >= 9) {
                for (int startIndex = 0; startIndex <= normalizedDigits.length() - 9; startIndex++) {
                    String candidate = normalizedDigits.substring(startIndex, startIndex + 9);
                    if (isLikelyCitizenId(candidate)) {
                        citizenId = candidate;
                        break;
                    }
                }
            }
        }

        String fullName = null;
        LocalDate dateOfBirth = null;
        String[] parts = qrText.split("\\|");
        for (String part : parts) {
            String cleanedPart = cleanLine(part);
            if (cleanedPart == null) {
                continue;
            }
            if (fullName == null) {
                String normalizedName = sanitizeName(cleanedPart);
                if (isLikelyFullName(normalizedName)) {
                    fullName = normalizedName;
                }
            }
            if (dateOfBirth == null) {
                dateOfBirth = parseDateFlexible(cleanedPart);
            }
        }

        if (citizenId == null && fullName == null && dateOfBirth == null) {
            return null;
        }
        return new IdentityEvidence("qr", citizenId, fullName, dateOfBirth);
    }

    private BufferedImage toRgbImage(BufferedImage source) {
        if (source.getType() == BufferedImage.TYPE_INT_RGB) {
            return source;
        }

        BufferedImage rgbImage = new BufferedImage(
                source.getWidth(),
                source.getHeight(),
                BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = rgbImage.createGraphics();
        try {
            graphics.drawImage(source, 0, 0, null);
        } finally {
            graphics.dispose();
        }

        return rgbImage;
    }

    private BufferedImage sharpenImage(BufferedImage source) {
        float[] kernelData = {
                -1f, -1f, -1f,
                -1f, 9f, -1f,
                -1f, -1f, -1f
        };
        Kernel kernel = new Kernel(3, 3, kernelData);
        ConvolveOp op = new ConvolveOp(kernel, ConvolveOp.EDGE_NO_OP, null);
        return op.filter(source, null);
    }

    private BufferedImage equalizeHistogram(BufferedImage source) {
        BufferedImage grayscale = toGrayscale(source);
        int width = grayscale.getWidth();
        int height = grayscale.getHeight();
        int[] histogram = new int[256];

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int gray = new Color(grayscale.getRGB(x, y)).getRed();
                histogram[gray]++;
            }
        }

        int total = width * height;
        int[] cdf = new int[256];
        cdf[0] = histogram[0];
        for (int i = 1; i < 256; i++) {
            cdf[i] = cdf[i - 1] + histogram[i];
        }

        if (total == cdf[0]) {
            return grayscale;
        }

        BufferedImage equalized = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int gray = new Color(grayscale.getRGB(x, y)).getRed();
                int newGray = (cdf[gray] - cdf[0]) * 255 / (total - cdf[0]);
                equalized.setRGB(x, y, new Color(newGray, newGray, newGray).getRGB());
            }
        }

        return equalized;
    }

    private BufferedImage adjustContrast(BufferedImage source, float contrast) {
        BufferedImage result = new BufferedImage(
                source.getWidth(),
                source.getHeight(),
                BufferedImage.TYPE_INT_RGB
        );

        for (int y = 0; y < source.getHeight(); y++) {
            for (int x = 0; x < source.getWidth(); x++) {
                Color color = new Color(source.getRGB(x, y));
                int red = clamp((int) (((color.getRed() - 128) * contrast) + 128));
                int green = clamp((int) (((color.getGreen() - 128) * contrast) + 128));
                int blue = clamp((int) (((color.getBlue() - 128) * contrast) + 128));
                result.setRGB(x, y, new Color(red, green, blue).getRGB());
            }
        }

        return result;
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(255, value));
    }

    private Tesseract createTesseract(Path tessDataPath) {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath.toString());
        tesseract.setLanguage(resolveLanguage(tessDataPath));
        tesseract.setOcrEngineMode(1);
        tesseract.setTessVariable("user_defined_dpi", "300");
        tesseract.setTessVariable("preserve_interword_spaces", "1");
        return tesseract;
    }

    private List<String> doOcrWithVariants(
            Tesseract tesseract,
            BufferedImage originalImage,
            boolean stopWhenCitizenIdFound) throws TesseractException {
        tesseract.setTessVariable("tessedit_char_whitelist", "");
        List<String> texts = new ArrayList<>();
        for (Integer pageSegmentationMode : PAGE_SEGMENTATION_MODES) {
            tesseract.setPageSegMode(pageSegmentationMode);
            for (BufferedImage variant : buildImageVariants(originalImage)) {
                String text = tesseract.doOCR(variant);
                if (text != null && !text.isBlank() && !texts.contains(text)) {
                    texts.add(text);
                    if (stopWhenCitizenIdFound && trichXuatSoCanCuoc(texts) != null) {
                        return texts;
                    }
                }
            }
        }

        return texts;
    }

    private List<String> doOcrWithOrientationVariants(
            Tesseract tesseract,
            BufferedImage originalImage,
            boolean stopWhenCitizenIdFound) throws TesseractException {
        List<String> texts = new ArrayList<>();
        for (BufferedImage orientationVariant : buildOrientationVariants(originalImage)) {
            for (String text : doOcrWithVariants(tesseract, orientationVariant, stopWhenCitizenIdFound)) {
                if (!texts.contains(text)) {
                    texts.add(text);
                }
            }
            if (stopWhenCitizenIdFound && trichXuatSoCanCuoc(texts) != null) {
                return texts;
            }
        }

        return texts;
    }

    private List<String> doCitizenIdOcr(
            Tesseract tesseract,
            BufferedImage image,
            boolean frontSide) throws TesseractException {
        List<String> texts = new ArrayList<>();
        tesseract.setTessVariable("tessedit_char_whitelist", DIGIT_OCR_WHITELIST);

        for (BufferedImage crop : buildCitizenIdCrops(image, frontSide)) {
            for (Integer pageSegmentationMode : DIGIT_PAGE_SEGMENTATION_MODES) {
                tesseract.setPageSegMode(pageSegmentationMode);
                for (BufferedImage variant : buildDigitImageVariants(crop)) {
                    String text = tesseract.doOCR(variant);
                    if (text != null && !text.isBlank() && !texts.contains(text)) {
                        texts.add(text);
                        if (trichXuatSoCanCuoc(texts) != null) {
                            tesseract.setTessVariable("tessedit_char_whitelist", "");
                            return texts;
                        }
                    }
                }
            }
        }

        tesseract.setTessVariable("tessedit_char_whitelist", "");
        return texts;
    }

    private List<String> doCitizenIdOcrWithOrientations(
            Tesseract tesseract,
            BufferedImage image,
            boolean frontSide) throws TesseractException {
        List<String> texts = new ArrayList<>();
        for (BufferedImage orientationVariant : buildOrientationVariants(image)) {
            for (String text : doCitizenIdOcr(tesseract, orientationVariant, frontSide)) {
                if (!texts.contains(text)) {
                    texts.add(text);
                }
            }
            if (trichXuatSoCanCuoc(texts) != null) {
                return texts;
            }
        }

        return texts;
    }

    private List<BufferedImage> buildCitizenIdCrops(BufferedImage image, boolean frontSide) {
        if (frontSide) {
            List<BufferedImage> frontCrops = new ArrayList<>();
            frontCrops.add(cropImage(image, 0.20d, 0.14d, 0.74d, 0.26d));
            frontCrops.add(cropImage(image, 0.28d, 0.28d, 0.64d, 0.22d));
            frontCrops.add(cropImage(image, 0.18d, 0.20d, 0.78d, 0.42d));
            frontCrops.add(cropImage(image, 0.14d, 0.16d, 0.82d, 0.34d));
            frontCrops.add(cropImage(image, 0.16d, 0.18d, 0.76d, 0.18d));
            frontCrops.add(cropImage(image, 0.12d, 0.22d, 0.82d, 0.18d));
            frontCrops.add(cropImage(image, 0.10d, 0.24d, 0.86d, 0.16d));
            frontCrops.add(cropImage(image, 0.08d, 0.12d, 0.88d, 0.30d));
            return frontCrops;
        }

        return List.of(
                cropImage(image, 0.02d, 0.54d, 0.96d, 0.38d),
                cropImage(image, 0.08d, 0.46d, 0.84d, 0.34d)
        );
    }

    private List<BufferedImage> buildDigitImageVariants(BufferedImage image) {
        BufferedImage preparedImage = prepareDigitCropForOcr(image);
        BufferedImage grayscaleImage = toGrayscale(preparedImage);
        BufferedImage highContrastImage = adjustContrast(preparedImage, 1.28f);
        BufferedImage equalizedImage = equalizeHistogram(preparedImage);
        BufferedImage sharpenedImage = toGrayscale(sharpenImage(preparedImage));

        return List.of(
                grayscaleImage,
                sharpenedImage,
                toBinary(grayscaleImage, 165),
                toBinary(grayscaleImage, 185),
                toBinary(toGrayscale(highContrastImage), 170),
                toBinary(equalizedImage, 168)
        );
    }

    private List<BufferedImage> buildImageVariants(BufferedImage originalImage) {
        List<BufferedImage> variants = new ArrayList<>();
        BufferedImage rgbImage = prepareImageForOcr(originalImage);
        BufferedImage grayscaleImage = toGrayscale(rgbImage);
        BufferedImage enhancedImage = enhanceImageForOcr(rgbImage);
        BufferedImage equalizedImage = equalizeHistogram(rgbImage);

        variants.add(rgbImage);
        variants.add(grayscaleImage);
        variants.add(enhancedImage);
        variants.add(equalizedImage);
        variants.add(toBinary(grayscaleImage, 170));

        return variants;
    }

    private BufferedImage prepareDigitCropForOcr(BufferedImage image) {
        BufferedImage preparedImage = prepareImageForOcr(image);
        int width = preparedImage.getWidth();
        int height = preparedImage.getHeight();

        double widthScale = width < TARGET_DIGIT_CROP_WIDTH
                ? (double) TARGET_DIGIT_CROP_WIDTH / width
                : 1d;
        double heightScale = height < TARGET_DIGIT_CROP_HEIGHT
                ? (double) TARGET_DIGIT_CROP_HEIGHT / height
                : 1d;
        double scaleFactor = Math.max(widthScale, heightScale);

        if (scaleFactor > 1d) {
            preparedImage = scaleImage(preparedImage, scaleFactor);
        }

        return preparedImage;
    }

    private List<BufferedImage> buildOrientationVariants(BufferedImage originalImage) {
        List<BufferedImage> variants = new ArrayList<>();
        variants.add(originalImage);
        variants.add(rotateImage(originalImage, 180));

        if (originalImage.getHeight() > originalImage.getWidth()) {
            variants.add(rotateImage(originalImage, 90));
            variants.add(rotateImage(originalImage, 270));
            return variants;
        }

        variants.add(rotateImage(originalImage, 90));
        variants.add(rotateImage(originalImage, 270));
        return variants;
    }

    private BufferedImage scaleImage(BufferedImage originalImage, double scaleFactor) {
        int width = Math.max(1, (int) Math.round(originalImage.getWidth() * scaleFactor));
        int height = Math.max(1, (int) Math.round(originalImage.getHeight() * scaleFactor));

        BufferedImage scaledImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = scaledImage.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(originalImage, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }

        return scaledImage;
    }

    private BufferedImage cropImage(
            BufferedImage sourceImage,
            double xFraction,
            double yFraction,
            double widthFraction,
            double heightFraction) {
        int x = clampDimension((int) Math.round(sourceImage.getWidth() * xFraction), sourceImage.getWidth() - 1);
        int y = clampDimension((int) Math.round(sourceImage.getHeight() * yFraction), sourceImage.getHeight() - 1);
        int width = Math.max(1, Math.min(
                sourceImage.getWidth() - x,
                (int) Math.round(sourceImage.getWidth() * widthFraction)
        ));
        int height = Math.max(1, Math.min(
                sourceImage.getHeight() - y,
                (int) Math.round(sourceImage.getHeight() * heightFraction)
        ));

        BufferedImage croppedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = croppedImage.createGraphics();
        try {
            graphics.drawImage(sourceImage, 0, 0, width, height, x, y, x + width, y + height, null);
        } finally {
            graphics.dispose();
        }

        return croppedImage;
    }

    private int clampDimension(int value, int maxValue) {
        return Math.max(0, Math.min(maxValue, value));
    }

    private BufferedImage toGrayscale(BufferedImage sourceImage) {
        BufferedImage grayscaleImage = new BufferedImage(
                sourceImage.getWidth(),
                sourceImage.getHeight(),
                BufferedImage.TYPE_BYTE_GRAY
        );

        Graphics2D graphics = grayscaleImage.createGraphics();
        try {
            graphics.drawImage(sourceImage, 0, 0, null);
        } finally {
            graphics.dispose();
        }

        return grayscaleImage;
    }

    private BufferedImage toBinary(BufferedImage sourceImage, int threshold) {
        BufferedImage binaryImage = new BufferedImage(
                sourceImage.getWidth(),
                sourceImage.getHeight(),
                BufferedImage.TYPE_BYTE_BINARY
        );

        for (int y = 0; y < sourceImage.getHeight(); y++) {
            for (int x = 0; x < sourceImage.getWidth(); x++) {
                int rgb = sourceImage.getRGB(x, y);
                int gray = rgb & 0xff;
                binaryImage.setRGB(x, y, gray < threshold ? Color.BLACK.getRGB() : Color.WHITE.getRGB());
            }
        }

        return binaryImage;
    }

    private BufferedImage rotateImage(BufferedImage sourceImage, int degrees) {
        int normalizedDegrees = ((degrees % 360) + 360) % 360;
        if (normalizedDegrees == 0) {
            return sourceImage;
        }

        int width = sourceImage.getWidth();
        int height = sourceImage.getHeight();
        int rotatedWidth = normalizedDegrees == 180 ? width : height;
        int rotatedHeight = normalizedDegrees == 180 ? height : width;

        BufferedImage rotatedImage = new BufferedImage(rotatedWidth, rotatedHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = rotatedImage.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.translate(rotatedWidth / 2.0, rotatedHeight / 2.0);
            graphics.rotate(Math.toRadians(normalizedDegrees));
            graphics.drawImage(sourceImage, -width / 2, -height / 2, null);
        } finally {
            graphics.dispose();
        }

        return rotatedImage;
    }

    private BufferedImage applyExifOrientation(BufferedImage sourceImage, int orientation) {
        return switch (orientation) {
            case 2 -> flipImage(sourceImage, true, false);
            case 3 -> rotateImage(sourceImage, 180);
            case 4 -> flipImage(sourceImage, false, true);
            case 5 -> rotateImage(flipImage(sourceImage, true, false), 270);
            case 6 -> rotateImage(sourceImage, 90);
            case 7 -> rotateImage(flipImage(sourceImage, true, false), 90);
            case 8 -> rotateImage(sourceImage, 270);
            default -> sourceImage;
        };
    }

    private BufferedImage flipImage(BufferedImage sourceImage, boolean horizontal, boolean vertical) {
        int width = sourceImage.getWidth();
        int height = sourceImage.getHeight();
        BufferedImage flippedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = flippedImage.createGraphics();
        try {
            int sourceX1 = horizontal ? width : 0;
            int sourceY1 = vertical ? height : 0;
            int sourceX2 = horizontal ? 0 : width;
            int sourceY2 = vertical ? 0 : height;
            graphics.drawImage(sourceImage, 0, 0, width, height, sourceX1, sourceY1, sourceX2, sourceY2, null);
        } finally {
            graphics.dispose();
        }

        return flippedImage;
    }

    private String chooseBestOcrText(List<String> texts) {
        return texts.stream()
                .max(Comparator.comparingInt(this::scoreOcrText))
                .orElse(null);
    }

    private int scoreOcrText(String text) {
        int score = text.length();
        String normalizedText = normalizeForLookup(text);

        score += countMatchedLabels(normalizedText, FULL_NAME_LABELS) * 100;
        score += countMatchedLabels(normalizedText, DATE_OF_BIRTH_LABELS) * 80;
        score += countMatchedLabels(normalizedText, ADDRESS_LABELS) * 50;
        if (DATE_PATTERN.matcher(text).find()) {
            score += 40;
        }

        return score;
    }

    private int countMatchedLabels(String normalizedText, List<String> labels) {
        int matched = 0;
        for (String label : labels) {
            if (normalizedText.contains(label)) {
                matched++;
            }
        }
        return matched;
    }

    private Path resolveTessDataPath() {
        List<Path> candidates = new ArrayList<>();
        addCandidate(candidates, configuredTessDataPath);
        addCandidate(candidates, System.getenv("TESSDATA_PREFIX"));
        addCandidate(candidates, System.getenv("TESSERACT_DATA_PATH"));
        addDefaultProjectCandidates(candidates);
        addCandidate(candidates, "tessdata");
        addCandidate(candidates, "C:\\Program Files\\Tesseract-OCR\\tessdata");
        addCandidate(candidates, "C:\\Program Files (x86)\\Tesseract-OCR\\tessdata");

        Set<Path> uniqueCandidates = new LinkedHashSet<>(candidates);
        for (Path candidate : uniqueCandidates) {
            Path tessDataDir = resolveCandidateTessDataDir(candidate);
            if (tessDataDir != null) {
                return tessDataDir;
            }
        }

        Path bundledTessData = extractBundledTessDataIfPresent();
        if (bundledTessData != null) {
            return bundledTessData;
        }

        throw new RuntimeException(buildMissingTessDataMessage());
    }

    private void addCandidate(List<Path> candidates, String rawPath) {
        if (rawPath == null || rawPath.isBlank()) {
            return;
        }

        candidates.add(Paths.get(rawPath).toAbsolutePath().normalize());
    }

    private void addDefaultProjectCandidates(List<Path> candidates) {
        Path workingDir = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        candidates.add(workingDir.resolve("tessdata"));
        candidates.add(workingDir.resolve("backend").resolve("tessdata"));
        candidates.add(workingDir.resolve("src").resolve("main").resolve("resources").resolve("tessdata"));
        candidates.add(workingDir.resolve("backend").resolve("src").resolve("main").resolve("resources").resolve("tessdata"));
    }

    private Path resolveCandidateTessDataDir(Path candidate) {
        if (candidate == null) {
            return null;
        }

        Path normalizedCandidate = candidate.toAbsolutePath().normalize();
        if (hasLanguageData(normalizedCandidate, normalizeLanguageCode(primaryLanguage))) {
            return normalizedCandidate;
        }

        Path nestedTessdata = normalizedCandidate.resolve("tessdata");
        if (hasLanguageData(nestedTessdata, normalizeLanguageCode(primaryLanguage))) {
            return nestedTessdata;
        }

        return null;
    }

    private boolean hasLanguageData(Path directory, String languageCode) {
        return directory != null
                && languageCode != null
                && Files.isRegularFile(directory.resolve(languageCode + ".traineddata"));
    }

    private Path extractBundledTessDataIfPresent() {
        String normalizedPrimaryLanguage = normalizeLanguageCode(primaryLanguage);
        ClassPathResource primaryLanguageResource =
                new ClassPathResource("tessdata/" + normalizedPrimaryLanguage + ".traineddata");
        if (!primaryLanguageResource.exists()) {
            return null;
        }

        Path tempDir = Paths.get(System.getProperty("java.io.tmpdir"), "roommate-tessdata")
                .toAbsolutePath()
                .normalize();

        try {
            Files.createDirectories(tempDir);
            copyResource(primaryLanguageResource, tempDir.resolve(normalizedPrimaryLanguage + ".traineddata"));

            String normalizedFallbackLanguage = normalizeOptionalLanguageCode(fallbackLanguage);
            if (normalizedFallbackLanguage != null && !normalizedFallbackLanguage.equals(normalizedPrimaryLanguage)) {
                ClassPathResource fallbackLanguageResource =
                        new ClassPathResource("tessdata/" + normalizedFallbackLanguage + ".traineddata");
                if (fallbackLanguageResource.exists()) {
                    copyResource(
                            fallbackLanguageResource,
                            tempDir.resolve(normalizedFallbackLanguage + ".traineddata")
                    );
                }
            }

            return tempDir;
        } catch (IOException ex) {
            throw new RuntimeException("Không thể trích xuất tessdata từ classpath: " + ex.getMessage(), ex);
        }
    }

    private String resolveLanguage(Path tessDataPath) {
        String normalizedPrimaryLanguage = normalizeLanguageCode(primaryLanguage);
        if (!hasLanguageData(tessDataPath, normalizedPrimaryLanguage)) {
            throw new RuntimeException("Không tìm thấy " + normalizedPrimaryLanguage + ".traineddata để OCR CCCD");
        }

        String normalizedFallbackLanguage = normalizeOptionalLanguageCode(fallbackLanguage);
        if (normalizedFallbackLanguage == null
                && !"eng".equals(normalizedPrimaryLanguage)
                && hasLanguageData(tessDataPath, "eng")) {
            normalizedFallbackLanguage = "eng";
        }
        if (normalizedFallbackLanguage != null
                && !normalizedFallbackLanguage.equals(normalizedPrimaryLanguage)
                && hasLanguageData(tessDataPath, normalizedFallbackLanguage)) {
            return normalizedPrimaryLanguage + "+" + normalizedFallbackLanguage;
        }

        return normalizedPrimaryLanguage;
    }

    private String normalizeLanguageCode(String languageCode) {
        if (languageCode == null || languageCode.isBlank()) {
            return "vie";
        }

        return languageCode.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptionalLanguageCode(String languageCode) {
        if (languageCode == null || languageCode.isBlank()) {
            return null;
        }

        return languageCode.trim().toLowerCase(Locale.ROOT);
    }

    private void copyResource(ClassPathResource resource, Path target) throws IOException {
        try (InputStream inputStream = resource.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private String buildMissingTessDataMessage() {
        return "Không tìm thấy tessdata cho OCR CCCD. Đặt vie.traineddata vào backend/tessdata "
                + "hoặc cấu hình app.cccd.ocr.tessdata-path (hoặc TESSDATA_PREFIX) tới thư mục chứa traineddata";
    }

    private void validateExtractedIdentity(String soCanCuocCongDan, String hoTen, LocalDate ngaySinh) {
        if (soCanCuocCongDan == null || soCanCuocCongDan.isBlank()) {
            log.warn("OCR CCCD khong trich xuat duoc so can cuoc");
            throw new RuntimeException(
                    "Không thể trích xuất số CCCD/CMND. Vui lòng dùng ảnh rõ nét, đủ sáng, không bị lóa và thấy rõ toàn bộ thẻ"
            );
        }
        if (hoTen == null || hoTen.isBlank()) {
            throw new RuntimeException("Không thể trích xuất họ tên từ CCCD/CMND. Cần ảnh mặt trước rõ phần họ tên.");
        }
        if (ngaySinh == null) {
            throw new RuntimeException("Không thể trích xuất ngày sinh từ CCCD/CMND. Cần ảnh rõ phần ngày sinh hoặc QR.");
        }
    }

    private void validateFrontBackConsistency(
            IdentityEvidence frontEvidence,
            IdentityEvidence backEvidence,
            IdentityEvidence qrEvidence,
            String citizenId,
            String fullName,
            LocalDate dateOfBirth) {
        if (frontEvidence == null || frontEvidence.citizenId == null) {
            throw new RuntimeException("Không thể đọc rõ số CCCD ở mặt trước.");
        }
        if (frontEvidence.fullName == null || frontEvidence.dateOfBirth == null) {
            throw new RuntimeException("Mặt trước CCCD phải đọc được cả họ tên và ngày sinh.");
        }

        assertMatchingCitizenId("Mặt trước", frontEvidence.citizenId, citizenId);
        assertMatchingCitizenId("QR CCCD", qrEvidence != null ? qrEvidence.citizenId : null, citizenId);

        assertMatchingFullName("Mặt trước", frontEvidence.fullName, fullName);
        assertMatchingFullName("QR CCCD", qrEvidence != null ? qrEvidence.fullName : null, fullName);

        assertMatchingDateOfBirth("Mặt trước", frontEvidence.dateOfBirth, dateOfBirth);
        assertMatchingDateOfBirth("QR CCCD", qrEvidence != null ? qrEvidence.dateOfBirth : null, dateOfBirth);
    }

    private void assertMatchingCitizenId(String source, String actual, String expected) {
        if (actual == null || expected == null) {
            return;
        }
        if (!actual.equals(expected)) {
            throw new RuntimeException(source + " không khớp số CCCD với thông tin còn lại.");
        }
    }

    private void assertMatchingFullName(String source, String actual, String expected) {
        if (actual == null || expected == null) {
            return;
        }
        if (!normalizeNameForComparison(actual).equals(normalizeNameForComparison(expected))) {
            throw new RuntimeException(source + " không khớp họ tên với thông tin còn lại.");
        }
    }

    private void assertMatchingDateOfBirth(String source, LocalDate actual, LocalDate expected) {
        if (actual == null || expected == null) {
            return;
        }
        if (!actual.equals(expected)) {
            throw new RuntimeException(source + " không khớp ngày sinh với thông tin còn lại.");
        }
    }

    private void validateCitizenIdNotUsedByAnotherUser(
            String soCanCuocCongDan,
            String soCanCuocCongDanHash,
            Integer maNguoiDung) {
        if (soCanCuocCongDanHash == null || soCanCuocCongDanHash.isBlank()) {
            return;
        }

        if (soCanCuocCongDanHash != null && !soCanCuocCongDanHash.isBlank()) {
            xacThucRepo.findBySoCanCuocCongDanHash(soCanCuocCongDanHash)
                    .filter(xacThuc -> !xacThuc.getNguoiDung().getMaNguoiDung().equals(maNguoiDung))
                    .ifPresent(xacThuc -> {
                        throw new RuntimeException("Căn cước này đã được dùng để xác thực cho tài khoản khác.");
                    });
        }

        String normalizedCitizenId = normalizeCitizenId(soCanCuocCongDan);
        if (normalizedCitizenId == null) {
            return;
        }

        boolean usedByAnotherUser = xacThucRepo.findAll().stream()
                .filter(xacThuc -> !xacThuc.getNguoiDung().getMaNguoiDung().equals(maNguoiDung))
                .map(XacThucDanhTinh::getSoCanCuocCongDan)
                .map(this::normalizeCitizenId)
                .anyMatch(normalizedCitizenId::equals);

        if (usedByAnotherUser) {
            throw new RuntimeException("Căn cước này đã được dùng để xác thực cho tài khoản khác.");
        }
    }

    private String normalizeCitizenId(String citizenId) {
        if (citizenId == null || citizenId.isBlank()) {
            return null;
        }

        String normalizedValue = citizenId.replaceAll("\\D", "");
        return normalizedValue.isBlank() ? null : normalizedValue;
    }

    private void validateImage(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ảnh " + fieldName);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new RuntimeException("File " + fieldName + " phải là ảnh");
        }
    }

    private String trichXuatHoTen(List<String> texts) {
        for (String text : texts) {
            String value = sanitizeName(trichXuatTheoNhan(text, FULL_NAME_LABELS, false));
            if (isLikelyFullName(value)) {
                return value;
            }
        }

        for (String text : texts) {
            String fallback = extractLikelyNameFromLines(text);
            if (fallback != null) {
                return fallback;
            }
        }

        return null;
    }

    private IdentityEvidence extractIdentityEvidenceFromTexts(String source, List<String> texts) {
        return new IdentityEvidence(
                source,
                trichXuatSoCanCuoc(texts),
                trichXuatHoTen(texts),
                trichXuatNgaySinh(texts)
        );
    }

    private boolean hasSufficientIdentityData(List<String> texts, IdentityEvidence qrEvidence) {
        if (texts == null || texts.isEmpty()) {
            return qrEvidence != null
                    && qrEvidence.citizenId != null
                    && qrEvidence.fullName != null
                    && qrEvidence.dateOfBirth != null;
        }

        IdentityEvidence evidence = extractIdentityEvidenceFromTexts("quick_check", texts);
        String citizenId = evidence != null ? evidence.citizenId : null;
        String fullName = evidence != null ? evidence.fullName : null;
        LocalDate dateOfBirth = evidence != null ? evidence.dateOfBirth : null;

        if (citizenId == null && qrEvidence != null) {
            citizenId = qrEvidence.citizenId;
        }
        if (fullName == null && qrEvidence != null) {
            fullName = qrEvidence.fullName;
        }
        if (dateOfBirth == null && qrEvidence != null) {
            dateOfBirth = qrEvidence.dateOfBirth;
        }

        return citizenId != null && fullName != null && dateOfBirth != null;
    }

    private String resolveCitizenId(
            IdentityEvidence frontEvidence,
            IdentityEvidence backEvidence,
            IdentityEvidence qrEvidence,
            Map<String, Integer> candidateScores) {
        if (frontEvidence != null && frontEvidence.citizenId != null
                && qrEvidence != null && qrEvidence.citizenId != null
                && frontEvidence.citizenId.equals(qrEvidence.citizenId)) {
            return frontEvidence.citizenId;
        }
        if (frontEvidence != null && frontEvidence.citizenId != null
                && backEvidence != null && backEvidence.citizenId != null
                && frontEvidence.citizenId.equals(backEvidence.citizenId)) {
            return frontEvidence.citizenId;
        }
        if (qrEvidence != null && qrEvidence.citizenId != null) {
            return qrEvidence.citizenId;
        }
        if (frontEvidence != null && frontEvidence.citizenId != null) {
            return frontEvidence.citizenId;
        }
        if (backEvidence != null && backEvidence.citizenId != null) {
            return backEvidence.citizenId;
        }
        return pickBestCitizenIdCandidate(candidateScores);
    }

    private String resolveFullName(IdentityEvidence frontEvidence, IdentityEvidence backEvidence, IdentityEvidence qrEvidence) {
        if (frontEvidence != null && frontEvidence.fullName != null) {
            return frontEvidence.fullName;
        }
        if (qrEvidence != null && qrEvidence.fullName != null) {
            return qrEvidence.fullName;
        }
        return backEvidence != null ? backEvidence.fullName : null;
    }

    private LocalDate resolveDateOfBirth(IdentityEvidence frontEvidence, IdentityEvidence backEvidence, IdentityEvidence qrEvidence) {
        if (frontEvidence != null && frontEvidence.dateOfBirth != null) {
            return frontEvidence.dateOfBirth;
        }
        if (qrEvidence != null && qrEvidence.dateOfBirth != null) {
            return qrEvidence.dateOfBirth;
        }
        return backEvidence != null ? backEvidence.dateOfBirth : null;
    }

    private String trichXuatSoCanCuoc(List<String> texts) {
        return pickBestCitizenIdCandidate(collectCitizenIdCandidates(texts));
    }

    private Map<String, Integer> collectCitizenIdCandidates(List<String> texts) {
        Map<String, Integer> candidateScores = new HashMap<>();

        for (String text : texts) {
            String[] lines = text.split("\\R");
            for (int i = 0; i < lines.length; i++) {
                String line = cleanLine(lines[i]);
                if (line == null) {
                    continue;
                }

                String normalizedLine = normalizeForLookup(line);
                boolean likelyIdLine = i <= 6 || containsAny(normalizedLine, CITIZEN_ID_LABELS);
                int lineBias = i <= 4 ? 30 : 0;
                if (containsAny(normalizedLine, CITIZEN_ID_LABELS)) {
                    lineBias += 80;
                }

                Matcher matcher = CITIZEN_ID_CANDIDATE_PATTERN.matcher(line);
                while (matcher.find()) {
                    String candidate = matcher.group(1).replaceAll("\\D", "");
                    if (!isLikelyCitizenId(candidate)) {
                        continue;
                    }

                    addCitizenIdCandidate(candidateScores, candidate, scoreCitizenIdCandidate(candidate, 200) + lineBias);
                }

                if (likelyIdLine) {
                    Matcher digitishMatcher = OCR_DIGITISH_CANDIDATE_PATTERN.matcher(line);
                    while (digitishMatcher.find()) {
                        String candidate = normalizeOcrDigitCandidate(digitishMatcher.group(1));
                        addCandidateSubstrings(candidateScores, candidate, lineBias + 150, true);
                    }
                }

                String normalizedDigitRun = normalizeOcrDigitCandidate(line);
                if (likelyIdLine || normalizedDigitRun.length() >= 9) {
                    addCandidateSubstrings(candidateScores, normalizedDigitRun, lineBias + 120, true);
                }

                if (i + 1 < lines.length) {
                    String nextLine = cleanLine(lines[i + 1]);
                    if (nextLine != null) {
                        String combinedLine = line + " " + nextLine;
                        String normalizedCombinedLine = normalizeForLookup(combinedLine);
                        int combinedBias = lineBias;
                        if (containsAny(normalizedCombinedLine, CITIZEN_ID_LABELS)) {
                            combinedBias += 50;
                        }
                        addCandidateSubstrings(
                                candidateScores,
                                normalizeOcrDigitCandidate(combinedLine),
                                combinedBias + 135,
                                true
                        );
                    }
                }
            }

            String normalizedTextDigits = normalizeOcrDigitCandidate(text);
            addCandidateSubstrings(candidateScores, normalizedTextDigits, 70, false);
        }

        return candidateScores;
    }

    private String pickBestCitizenIdCandidate(Map<String, Integer> candidateScores) {
        return candidateScores.entrySet().stream()
                .max(Comparator.<Map.Entry<String, Integer>>comparingInt(Map.Entry::getValue)
                        .thenComparingInt(entry -> entry.getKey().length()))
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private void addCandidateSubstrings(
            Map<String, Integer> candidateScores,
            String normalizedDigits,
            int baseScore,
            boolean preferTwelveDigits) {
        if (normalizedDigits == null || normalizedDigits.isBlank()) {
            return;
        }

        if (isLikelyCitizenId(normalizedDigits)) {
            addCitizenIdCandidate(candidateScores, normalizedDigits, scoreCitizenIdCandidate(normalizedDigits, baseScore));
        }

        if (normalizedDigits.length() < 9) {
            return;
        }

        int[] preferredLengths = preferTwelveDigits ? new int[]{12, 9} : new int[]{12, 9};
        for (int length : preferredLengths) {
            if (normalizedDigits.length() < length) {
                continue;
            }
            for (int startIndex = 0; startIndex <= normalizedDigits.length() - length; startIndex++) {
                String candidate = normalizedDigits.substring(startIndex, startIndex + length);
                if (!isLikelyCitizenId(candidate)) {
                    continue;
                }
                int positionalBonus = startIndex == 0 ? 18 : Math.max(0, 12 - startIndex);
                addCitizenIdCandidate(
                        candidateScores,
                        candidate,
                        scoreCitizenIdCandidate(candidate, baseScore - Math.max(0, startIndex * 2) + positionalBonus)
                );
            }
        }
    }

    private void addCitizenIdCandidate(Map<String, Integer> candidateScores, String candidate, int score) {
        if (!isLikelyCitizenId(candidate)) {
            return;
        }
        candidateScores.merge(candidate, score, Integer::sum);
    }

    private int scoreCitizenIdCandidate(String candidate, int baseScore) {
        int score = baseScore;
        if (candidate == null) {
            return score;
        }
        if (candidate.length() == 12) {
            score += 40;
        } else if (candidate.length() == 9) {
            score += 15;
        }
        if (candidate.matches("0{4,}.*") || candidate.matches(".*0{4,}")) {
            score -= 40;
        }
        return score;
    }

    private String summarizeCandidateScores(Map<String, Integer> candidateScores) {
        if (candidateScores == null || candidateScores.isEmpty()) {
            return "[]";
        }

        return candidateScores.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(6)
                .map(entry -> maskCitizenId(entry.getKey()) + ":" + entry.getValue())
                .reduce((left, right) -> left + ", " + right)
                .map(result -> "[" + result + "]")
                .orElse("[]");
    }

    private boolean isLikelyCitizenId(String value) {
        return value != null && (value.length() == 9 || value.length() == 12);
    }

    private String normalizeOcrDigitCandidate(String value) {
        if (value == null) {
            return null;
        }

        return value
                .toUpperCase(Locale.ROOT)
                .replace('O', '0')
                .replace('Q', '0')
                .replace('I', '1')
                .replace('L', '1')
                .replace('S', '5')
                .replace('B', '8')
                .replace('Z', '2')
                .replace('G', '6')
                .replaceAll("\\D", "");
    }

    private String maskCitizenId(String soCanCuocCongDan) {
        if (soCanCuocCongDan == null || soCanCuocCongDan.length() < 4) {
            return soCanCuocCongDan;
        }
        return "*".repeat(Math.max(0, soCanCuocCongDan.length() - 4))
                + soCanCuocCongDan.substring(soCanCuocCongDan.length() - 4);
    }

    private LocalDate trichXuatNgaySinh(List<String> texts) {
        for (String text : texts) {
            LocalDate dateNearLabel = trichXuatNgayTheoNhan(text, DATE_OF_BIRTH_LABELS);
            if (dateNearLabel != null) {
                return dateNearLabel;
            }
        }

        for (String text : texts) {
            LocalDate fallbackDate = trichXuatNgayBatKy(text);
            if (fallbackDate != null) {
                return fallbackDate;
            }
        }

        return null;
    }

    private LocalDate trichXuatNgayTheoNhan(String text, List<String> nhanCanTim) {
        String[] lines = text.split("\\R");

        for (int i = 0; i < lines.length; i++) {
            String line = cleanLine(lines[i]);
            if (line == null) {
                continue;
            }

            String normalizedLine = normalizeForLookup(line);
            if (!containsAny(normalizedLine, nhanCanTim)) {
                continue;
            }

            LocalDate currentLineDate = parseDateFromText(line);
            if (currentLineDate != null) {
                return currentLineDate;
            }

            for (int nextIndex = i + 1; nextIndex <= Math.min(i + 2, lines.length - 1); nextIndex++) {
                LocalDate nextLineDate = parseDateFromText(lines[nextIndex]);
                if (nextLineDate != null) {
                    return nextLineDate;
                }
            }
        }

        return null;
    }

    private LocalDate trichXuatNgayBatKy(String text) {
        Matcher matcher = DATE_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }

        return toLocalDate(matcher);
    }

    private LocalDate parseDateFromText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        Matcher matcher = DATE_PATTERN.matcher(value);
        if (!matcher.find()) {
            return null;
        }

        return toLocalDate(matcher);
    }

    private LocalDate parseDateFlexible(String value) {
        LocalDate parsedDate = parseDateFromText(value);
        if (parsedDate != null) {
            return parsedDate;
        }
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.length() == 8) {
            try {
                return LocalDate.of(
                        Integer.parseInt(digits.substring(4, 8)),
                        Integer.parseInt(digits.substring(2, 4)),
                        Integer.parseInt(digits.substring(0, 2))
                );
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private LocalDate toLocalDate(Matcher matcher) {
        try {
            return LocalDate.of(
                    Integer.parseInt(matcher.group(3)),
                    Integer.parseInt(matcher.group(2)),
                    Integer.parseInt(matcher.group(1))
            );
        } catch (Exception ignored) {
            return null;
        }
    }

    private String trichXuatDiaChi(List<String> texts) {
        for (String text : texts) {
            String value = trichXuatTheoNhan(text, ADDRESS_LABELS, true);
            if (value != null) {
                return value;
            }
        }

        return null;
    }

    private String trichXuatTheoNhan(String text, List<String> nhanCanTim, boolean multiLineValue) {
        String[] lines = text.split("\\R");

        for (int i = 0; i < lines.length; i++) {
            String line = cleanLine(lines[i]);
            if (line == null) {
                continue;
            }

            String normalizedLine = normalizeForLookup(line);
            for (String nhan : nhanCanTim) {
                if (!normalizedLine.contains(nhan)) {
                    continue;
                }

                String giaTri = extractValueFromLine(line);
                if (giaTri != null) {
                    return multiLineValue ? mergeFollowingLines(lines, i, giaTri) : giaTri;
                }

                if (i + 1 < lines.length) {
                    String nextLine = cleanLine(lines[i + 1]);
                    if (nextLine != null) {
                        return multiLineValue ? mergeFollowingLines(lines, i + 1, nextLine) : nextLine;
                    }
                }
            }
        }

        return null;
    }

    private String mergeFollowingLines(String[] lines, int startIndex, String firstValue) {
        StringBuilder builder = new StringBuilder(firstValue);
        for (int i = startIndex + 1; i < Math.min(startIndex + 3, lines.length); i++) {
            String nextLine = cleanLine(lines[i]);
            if (nextLine == null) {
                break;
            }

            String normalizedNextLine = normalizeForLookup(nextLine);
            if (containsAny(normalizedNextLine, FULL_NAME_LABELS)
                    || containsAny(normalizedNextLine, DATE_OF_BIRTH_LABELS)
                    || containsAny(normalizedNextLine, ADDRESS_LABELS)) {
                break;
            }

            if (builder.indexOf(nextLine) < 0) {
                builder.append(", ").append(nextLine);
            }
        }

        return builder.toString();
    }

    private boolean containsAny(String normalizedValue, List<String> labels) {
        for (String label : labels) {
            if (normalizedValue.contains(label)) {
                return true;
            }
        }
        return false;
    }

    private String extractValueFromLine(String line) {
        int colonIndex = line.indexOf(':');
        if (colonIndex >= 0 && colonIndex + 1 < line.length()) {
            String value = cleanLine(line.substring(colonIndex + 1));
            if (value != null) {
                return value;
            }
        }

        String[] parts = line.split("\\s{2,}");
        if (parts.length >= 2) {
            String value = cleanLine(parts[parts.length - 1]);
            if (value != null) {
                return value;
            }
        }

        return null;
    }

    private String extractLikelyNameFromLines(String text) {
        String[] lines = text.split("\\R");
        for (int i = 0; i < lines.length; i++) {
            String line = sanitizeName(cleanLine(lines[i]));
            if (!isLikelyFullName(line)) {
                continue;
            }

            String previousLine = i > 0 ? normalizeForLookup(lines[i - 1]) : "";
            String currentLine = normalizeForLookup(lines[i]);
            if (containsAny(previousLine, FULL_NAME_LABELS) || !containsAny(currentLine, NON_NAME_KEYWORDS)) {
                return line;
            }
        }

        return null;
    }

    private String sanitizeName(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value
                .replaceAll("[^\\p{L}\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private String normalizeNameForComparison(String value) {
        String sanitized = sanitizeName(value);
        return sanitized == null ? "" : normalizeForLookup(sanitized).replaceAll("\\s+", " ").trim();
    }

    private boolean isLikelyFullName(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        if (value.matches(".*\\d.*")) {
            return false;
        }

        String normalizedValue = normalizeForLookup(value);
        if (containsAny(normalizedValue, NON_NAME_KEYWORDS)) {
            return false;
        }

        String[] words = value.split("\\s+");
        return words.length >= 2 && words.length <= 7;
    }

    private String cleanLine(String rawLine) {
        if (rawLine == null) {
            return null;
        }

        String cleaned = rawLine.replace('|', ' ').trim().replaceAll("\\s+", " ");
        return cleaned.isBlank() ? null : cleaned;
    }

    private String normalizeForLookup(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        return normalized.replace('\u0111', 'd');
    }

    private String summarizeText(String text) {
        if (text == null) {
            return "";
        }

        String singleLine = text.replaceAll("\\s+", " ").trim();
        return singleLine.substring(0, Math.min(singleLine.length(), 220));
    }
}


