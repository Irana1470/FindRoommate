package com.roommate.service;

import com.roommate.dto.PhieuTamTruDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class PhieuTamTruPdfService {

    private static final PDRectangle PAGE_SIZE = PDRectangle.A4;
    private static final float PAGE_WIDTH = PAGE_SIZE.getWidth();
    private static final float PAGE_HEIGHT = PAGE_SIZE.getHeight();
    private static final float MARGIN = 34f;
    private static final float CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
    private static final float COLUMN_GAP = 18f;
    private static final float HALF_WIDTH = (CONTENT_WIDTH - COLUMN_GAP) / 2f;

    private static final float TITLE_FONT_SIZE = 15f;
    private static final float BODY_FONT_SIZE = 10f;
    private static final float SMALL_FONT_SIZE = 8f;
    private static final float NOTE_FONT_SIZE = 6.7f;
    private static final float LINE_GAP = 14f;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final List<String> NOTES = List.of(
            "(1) Cơ quan đăng ký cư trú.",
            "(2) Ghi rõ ràng, cụ thể nội dung đề nghị. Ví dụ: đăng ký thường trú; đăng ký tạm trú; tách hộ; xác nhận thông tin về cư trú...",
            "(3) Áp dụng đối với các trường hợp quy định tại khoản 2, khoản 3, khoản 5, khoản 6 Điều 20; khoản 1 Điều 25; điểm a khoản 1 Điều 26 Luật Cư trú. Việc lấy ý kiến của chủ hộ được thực hiện theo các phương thức sau: a) Chủ hộ ghi rõ nội dung đồng ý và ký, ghi rõ họ tên vào Tờ khai. b) Chủ hộ xác nhận nội dung đồng ý thông qua ứng dụng VNeID hoặc các dịch vụ công trực tuyến khác. c) Chủ hộ có văn bản riêng ghi rõ nội dung đồng ý (văn bản này không phải công chứng, chứng thực).",
            "(4) Áp dụng đối với các trường hợp quy định tại khoản 2, khoản 3, khoản 4, khoản 5, khoản 6 Điều 20; khoản 1 Điều 25 Luật Cư trú; điểm a khoản 1 Điều 26 Luật Cư trú. Việc lấy ý kiến của chủ sở hữu chỗ ở hợp pháp được thực hiện theo các phương thức sau: a) Chủ sở hữu chỗ ở hợp pháp ghi rõ nội dung đồng ý và ký, ghi rõ họ tên vào Tờ khai. b) Chủ sở hữu chỗ ở hợp pháp xác nhận nội dung đồng ý thông qua ứng dụng VNeID hoặc các dịch vụ công trực tuyến khác. c) Chủ sở hữu chỗ ở hợp pháp có văn bản riêng ghi rõ nội dung đồng ý (văn bản này không phải công chứng, chứng thực). Ghi chú: Trường hợp chủ sở hữu chỗ ở hợp pháp gồm nhiều cá nhân, tổ chức thì phải có ý kiến đồng ý của tất cả các đồng sở hữu, trừ trường hợp đã có thỏa thuận về việc cử đại diện có ý kiến đồng ý; trường hợp chủ sở hữu chỗ ở hợp pháp xác nhận nội dung đồng ý thông qua ứng dụng VNeID thì công dân phải kê khai thông tin về họ, chữ đệm, tên và số ĐDCN của chủ sở hữu chỗ ở hợp pháp.",
            "(5) Áp dụng đối với trường hợp người chưa thành niên, người hạn chế hành vi dân sự, người không đủ năng lực hành vi dân sự có thay đổi thông tin về cư trú. Việc lấy ý kiến của cha, mẹ hoặc người giám hộ được thực hiện theo các phương thức sau: a) Cha, mẹ hoặc người giám hộ ghi rõ nội dung đồng ý và ký, ghi rõ họ tên vào Tờ khai. b) Cha, mẹ hoặc người giám hộ xác nhận nội dung đồng ý thông qua ứng dụng VNeID hoặc các dịch vụ công trực tuyến khác. c) Cha, mẹ hoặc người giám hộ có văn bản riêng ghi rõ nội dung đồng ý (văn bản này không phải công chứng, chứng thực).",
            "(6) Trường hợp nộp trực tiếp, người kê khai ký, ghi rõ họ, chữ đệm và tên vào Tờ khai. Trường hợp nộp qua cổng dịch vụ công hoặc ứng dụng VNeID thì người kê khai không phải ký vào mục này.",
            "(7) Chỉ kê khai thông tin khi công dân đề nghị xác nhận nội dung đồng ý thông qua ứng dụng VNeID."
    );

    public byte[] generatePdf(PhieuTamTruDTO.Response data) {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfFonts fonts = loadFonts(document);
            PDPage page = new PDPage(PAGE_SIZE);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = PAGE_HEIGHT - MARGIN;

                y = drawHeader(content, fonts, y);
                y = drawSingleUnderlineRow(content, fonts, y, "Kính gửi(1):", data.getCoQuanDangKy());
                y = drawSingleUnderlineRow(content, fonts, y, "1. Họ, chữ đệm và tên:", data.getHoTen());
                y = drawDateGenderRow(content, fonts, y, data.getNgaySinh(), data.getGioiTinh());
                y = drawIdentityRow(content, fonts, y, "4. Số định danh cá nhân:", data.getSoCanCuocCongDan());
                y = drawSplitUnderlineRow(content, fonts, y,
                        "5. Số điện thoại liên hệ:", data.getSoDienThoai(),
                        "6. Email:", data.getEmail());
                y = drawSplitUnderlineRow(content, fonts, y,
                        "7. Họ, chữ đệm và tên chủ hộ:", data.getTenChuHo(),
                        "8. Mối quan hệ với chủ hộ:", data.getQuanHeVoiChuHo());
                y = drawIdentityRow(content, fonts, y, "9. Số định danh cá nhân của chủ hộ:", data.getSoDinhDanhChuHo());
                y = drawMultilineUnderlineRow(content, fonts, y, "Địa chỉ thường trú:", data.getDiaChiThuongTru(), 2);
                y = drawMultilineUnderlineRow(content, fonts, y, "Địa chỉ tạm trú:", data.getDiaChiTamTru(), 2);
                y = drawMultilineUnderlineRow(content, fonts, y, "10. Nội dung đề nghị(2):", data.getNoiDungDeNghi(), 3);
                y = drawHouseholdTable(content, fonts, y);
                y = drawSignatureSection(content, fonts, y, data);
                drawNotes(content, fonts, y - 6f);
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new RuntimeException("Khong the tao file PDF cho phieu tam tru", ex);
        }
    }

    private float drawHeader(PDPageContentStream content, PdfFonts fonts, float topY) throws IOException {
        drawCenteredText(content, fonts.bold, BODY_FONT_SIZE + 1f, MARGIN, topY, CONTENT_WIDTH,
                "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM");
        drawCenteredText(content, fonts.bold, BODY_FONT_SIZE, MARGIN, topY - 14f, CONTENT_WIDTH,
                "Độc lập - Tự do - Hạnh phúc");

        content.setLineWidth(0.8f);
        content.moveTo((PAGE_WIDTH / 2f) - 95f, topY - 22f);
        content.lineTo((PAGE_WIDTH / 2f) + 95f, topY - 22f);
        content.stroke();

        drawCenteredText(content, fonts.bold, TITLE_FONT_SIZE, MARGIN, topY - 42f, CONTENT_WIDTH,
                "TỜ KHAI THAY ĐỔI THÔNG TIN CƯ TRÚ");
        return topY - 58f;
    }

    private float drawSingleUnderlineRow(PDPageContentStream content, PdfFonts fonts, float topY,
                                         String label, String value) throws IOException {
        drawText(content, fonts.regular, BODY_FONT_SIZE, MARGIN, topY, label);
        float labelWidth = textWidth(fonts.regular, BODY_FONT_SIZE, label) + 6f;
        drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE,
                MARGIN + labelWidth, topY, CONTENT_WIDTH - labelWidth, safe(value));
        return topY - LINE_GAP;
    }

    private float drawDateGenderRow(PDPageContentStream content, PdfFonts fonts, float topY,
                                    String rawDate, String gender) throws IOException {
        String dateLabel = "2. Ngày, tháng, năm sinh:";
        float leftWidth = 330f;
        drawText(content, fonts.regular, BODY_FONT_SIZE, MARGIN, topY, dateLabel);
        float labelWidth = textWidth(fonts.regular, BODY_FONT_SIZE, dateLabel) + 6f;
        drawDateBoxes(content, fonts, MARGIN + labelWidth, topY, leftWidth - labelWidth - 8f, rawDate);

        float rightX = MARGIN + leftWidth;
        String genderLabel = "3. Giới tính:";
        drawText(content, fonts.regular, BODY_FONT_SIZE, rightX, topY, genderLabel);
        float genderLabelWidth = textWidth(fonts.regular, BODY_FONT_SIZE, genderLabel) + 6f;
        drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE,
                rightX + genderLabelWidth, topY, CONTENT_WIDTH - leftWidth - genderLabelWidth, safe(gender));
        return topY - LINE_GAP;
    }

    private float drawSplitUnderlineRow(PDPageContentStream content, PdfFonts fonts, float topY,
                                        String leftLabel, String leftValue,
                                        String rightLabel, String rightValue) throws IOException {
        drawText(content, fonts.regular, BODY_FONT_SIZE, MARGIN, topY, leftLabel);
        float leftLabelWidth = textWidth(fonts.regular, BODY_FONT_SIZE, leftLabel) + 6f;
        drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE,
                MARGIN + leftLabelWidth, topY, HALF_WIDTH - leftLabelWidth, safe(leftValue));

        float rightX = MARGIN + HALF_WIDTH + COLUMN_GAP;
        drawText(content, fonts.regular, BODY_FONT_SIZE, rightX, topY, rightLabel);
        float rightLabelWidth = textWidth(fonts.regular, BODY_FONT_SIZE, rightLabel) + 6f;
        drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE,
                rightX + rightLabelWidth, topY, HALF_WIDTH - rightLabelWidth, safe(rightValue));
        return topY - LINE_GAP;
    }

    private float drawIdentityRow(PDPageContentStream content, PdfFonts fonts, float topY,
                                  String label, String value) throws IOException {
        drawText(content, fonts.regular, BODY_FONT_SIZE, MARGIN, topY, label);
        float labelWidth = textWidth(fonts.regular, BODY_FONT_SIZE, label) + 8f;
        float boxesX = MARGIN + labelWidth;
        float boxesWidth = CONTENT_WIDTH - labelWidth;
        drawIdentityBoxes(content, fonts, boxesX, topY, boxesWidth, value);
        return topY - (LINE_GAP + 2f);
    }

    private float drawMultilineUnderlineRow(PDPageContentStream content, PdfFonts fonts, float topY,
                                            String label, String value, int minLines) throws IOException {
        drawText(content, fonts.regular, BODY_FONT_SIZE, MARGIN, topY, label);
        float labelWidth = textWidth(fonts.regular, BODY_FONT_SIZE, label) + 6f;
        List<String> lines = wrapTextAcrossWidths(safe(value), fonts.regular, BODY_FONT_SIZE,
                CONTENT_WIDTH - labelWidth, CONTENT_WIDTH);

        while (lines.size() < minLines) {
            lines.add("");
        }
        if (lines.isEmpty()) {
            lines.add("");
        }

        float textY = topY;
        for (int i = 0; i < lines.size(); i++) {
            float lineX = i == 0 ? MARGIN + labelWidth : MARGIN;
            float lineWidth = i == 0 ? CONTENT_WIDTH - labelWidth : CONTENT_WIDTH;
            drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE, lineX, textY, lineWidth, lines.get(i));
            textY -= 13f;
        }

        return textY - 2f;
    }

    private float drawHouseholdTable(PDPageContentStream content, PdfFonts fonts, float topY) throws IOException {
        drawText(content, fonts.regular, BODY_FONT_SIZE, MARGIN, topY,
                "11. Những thành viên trong hộ gia đình cùng thay đổi:");

        float tableTop = topY - 8f;
        float[] widths = {24f, 142f, 90f, 52f, 110f, 105f};
        float headerHeight = 28f;
        float rowHeight = 28f;
        String[] headers = {
                "TT",
                "Họ, chữ đệm và tên",
                "Ngày, tháng, năm sinh",
                "Giới tính",
                "Số định danh cá nhân",
                "Mối quan hệ với chủ hộ"
        };

        float currentX = MARGIN;
        for (int i = 0; i < widths.length; i++) {
            content.addRect(currentX, tableTop - headerHeight, widths[i], headerHeight);
            content.stroke();
            drawCenteredParagraph(content, fonts.bold, SMALL_FONT_SIZE - 0.2f, currentX + 3f, tableTop - 9f,
                    widths[i] - 6f, headers[i], 8.2f);
            currentX += widths[i];
        }

        currentX = MARGIN;
        for (float width : widths) {
            content.addRect(currentX, tableTop - headerHeight - rowHeight, width, rowHeight);
            content.stroke();
            currentX += width;
        }
        drawCenteredText(content, fonts.regular, BODY_FONT_SIZE, MARGIN, tableTop - headerHeight - 17f, widths[0], "1");
        return tableTop - headerHeight - rowHeight - 12f;
    }

    private float drawSignatureSection(PDPageContentStream content, PdfFonts fonts, float topY,
                                       PhieuTamTruDTO.Response data) throws IOException {
        float firstRowTop = topY;
        float secondRowTop = topY - 104f;

        drawSignatureBlock(content, fonts, MARGIN, firstRowTop, HALF_WIDTH,
                buildDateLine(data.getNgayBatDau()), "Ý KIẾN CỦA CHỦ HỘ(3)", "", "", false);
        drawSignatureBlock(content, fonts, MARGIN + HALF_WIDTH + COLUMN_GAP, firstRowTop, HALF_WIDTH,
                buildDateLine(data.getNgayBatDau()), "Ý KIẾN CỦA CHỦ SỞ HỮU CHỖ Ở HỢP PHÁP(4)",
                data.getTenChuHo(), data.getSoDinhDanhChuHo(), true);

        drawSignatureBlock(content, fonts, MARGIN, secondRowTop, HALF_WIDTH,
                buildDateLine(data.getNgayBatDau()), "Ý KIẾN CỦA CHA, MẸ HOẶC NGƯỜI GIÁM HỘ(5)",
                "", "", true);
        drawSignatureBlock(content, fonts, MARGIN + HALF_WIDTH + COLUMN_GAP, secondRowTop, HALF_WIDTH,
                buildDateLine(data.getNgayBatDau()), "NGƯỜI KÊ KHAI(6)",
                data.getHoTen(), "", false);

        return secondRowTop - 94f;
    }

    private void drawSignatureBlock(PDPageContentStream content, PdfFonts fonts,
                                    float x, float topY, float width,
                                    String dateLine, String title,
                                    String signerName, String signerId,
                                    boolean showIdentityFields) throws IOException {
        drawCenteredText(content, fonts.italic, SMALL_FONT_SIZE, x, topY, width, dateLine);
        drawCenteredParagraph(content, fonts.bold, SMALL_FONT_SIZE + 0.2f, x, topY - 11f, width, title, 9f);

        float metaTop = topY - 36f;
        if (showIdentityFields) {
            drawText(content, fonts.regular, SMALL_FONT_SIZE, x, metaTop, "(7) Họ và tên:");
            float nameLabelWidth = textWidth(fonts.regular, SMALL_FONT_SIZE, "(7) Họ và tên:") + 4f;
            drawUnderlineText(content, fonts.regular, SMALL_FONT_SIZE, x + nameLabelWidth, metaTop,
                    width - nameLabelWidth, safe(signerName));

            float idY = metaTop - 11f;
            drawText(content, fonts.regular, SMALL_FONT_SIZE, x, idY, "(7) Số định danh cá nhân:");
            float idLabelWidth = textWidth(fonts.regular, SMALL_FONT_SIZE, "(7) Số định danh cá nhân:") + 4f;
            drawUnderlineText(content, fonts.regular, SMALL_FONT_SIZE, x + idLabelWidth, idY,
                    width - idLabelWidth, safe(signerId));
        }

        if (!showIdentityFields) {
            drawCenteredText(content, fonts.regular, SMALL_FONT_SIZE, x, topY - 36f, width, "(Ký, ghi rõ họ tên)");
        }

        drawCenteredText(content, fonts.bold, BODY_FONT_SIZE - 0.5f, x, topY - 88f, width, safe(signerName));
    }

    private void drawNotes(PDPageContentStream content, PdfFonts fonts, float topY) throws IOException {
        drawText(content, fonts.bold, NOTE_FONT_SIZE + 0.4f, MARGIN, topY, "Chú thích:");
        float y = topY - 8f;
        for (String note : NOTES) {
            List<String> lines = wrapText(note, fonts.regular, NOTE_FONT_SIZE, CONTENT_WIDTH);
            y = drawWrappedText(content, fonts.regular, NOTE_FONT_SIZE, MARGIN, y, lines, 7.6f) - 2f;
        }
    }

    private void drawDateBoxes(PDPageContentStream content, PdfFonts fonts, float x, float y,
                               float width, String rawDate) throws IOException {
        LocalDate parsed = parseDate(rawDate);
        String day = parsed == null ? "" : String.format("%02d", parsed.getDayOfMonth());
        String month = parsed == null ? "" : String.format("%02d", parsed.getMonthValue());
        String year = parsed == null ? "" : String.valueOf(parsed.getYear());

        float boxWidth = 28f;
        float yearWidth = 44f;
        drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE, x, y, boxWidth, day);
        drawText(content, fonts.regular, BODY_FONT_SIZE, x + boxWidth + 2f, y, "/");
        drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE, x + boxWidth + 10f, y, boxWidth, month);
        drawText(content, fonts.regular, BODY_FONT_SIZE, x + (boxWidth * 2f) + 12f, y, "/");
        drawUnderlineText(content, fonts.regular, BODY_FONT_SIZE, x + (boxWidth * 2f) + 20f, y, yearWidth, year);
    }

    private void drawIdentityBoxes(PDPageContentStream content, PdfFonts fonts, float x, float y,
                                   float width, String value) throws IOException {
        String digits = safe(value).replaceAll("\\D", "");
        float gap = 3f;
        float boxWidth = (width - (gap * 11f)) / 12f;

        for (int i = 0; i < 12; i++) {
            float boxX = x + (i * (boxWidth + gap));
            content.addRect(boxX, y - 12f, boxWidth, 16f);
            content.stroke();

            String digit = i < digits.length() ? String.valueOf(digits.charAt(i)) : "";
            drawCenteredText(content, fonts.regular, BODY_FONT_SIZE, boxX, y - 0.5f, boxWidth, digit);
        }
    }

    private void drawUnderlineText(PDPageContentStream content, PDFont font, float fontSize,
                                   float x, float y, float width, String text) throws IOException {
        content.moveTo(x, y - 2f);
        content.lineTo(x + width, y - 2f);
        content.stroke();

        if (!safe(text).isBlank()) {
            drawText(content, font, fontSize, x + 2f, y, text);
        }
    }

    private PdfFonts loadFonts(PDDocument document) throws IOException {
        return new PdfFonts(
                loadFont(document,
                        "C:\\Windows\\Fonts\\times.ttf",
                        "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"),
                loadFont(document,
                        "C:\\Windows\\Fonts\\timesbd.ttf",
                        "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"),
                loadFont(document,
                        "C:\\Windows\\Fonts\\timesi.ttf",
                        "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Italic.ttf",
                        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf")
        );
    }

    private PDFont loadFont(PDDocument document, String... candidates) throws IOException {
        for (String candidate : candidates) {
            Path path = Path.of(candidate);
            if (Files.exists(path)) {
                try (var inputStream = Files.newInputStream(path)) {
                    return PDType0Font.load(document, inputStream);
                }
            }
        }
        throw new IOException("Khong tim thay font ho tro tieng Viet de tao PDF");
    }

    private List<String> wrapTextAcrossWidths(String text, PDFont font, float fontSize,
                                              float firstLineWidth, float nextLineWidth) throws IOException {
        List<String> lines = new ArrayList<>();
        String remaining = safe(text).replace("\r", "").trim();
        if (remaining.isEmpty()) {
            return lines;
        }

        float currentWidth = firstLineWidth;
        while (!remaining.isEmpty()) {
            String nextLine = fitLine(remaining, font, fontSize, currentWidth);
            lines.add(nextLine);
            remaining = remaining.substring(nextLine.length()).trim();
            currentWidth = nextLineWidth;
        }
        return lines;
    }

    private String fitLine(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
        String[] words = text.split("\\s+");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            String candidate = currentLine.isEmpty() ? word : currentLine + " " + word;
            if (textWidth(font, fontSize, candidate) <= maxWidth) {
                currentLine.setLength(0);
                currentLine.append(candidate);
            } else {
                if (!currentLine.isEmpty()) {
                    return currentLine.toString();
                }
                return word;
            }
        }

        return currentLine.toString();
    }

    private List<String> wrapText(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
        List<String> lines = new ArrayList<>();
        String normalized = safe(text).replace("\r", "");
        if (normalized.isBlank()) {
            return lines;
        }

        for (String paragraph : normalized.split("\n")) {
            String trimmedParagraph = paragraph.trim();
            if (trimmedParagraph.isEmpty()) {
                continue;
            }

            String remaining = trimmedParagraph;
            while (!remaining.isEmpty()) {
                String line = fitLine(remaining, font, fontSize, maxWidth);
                lines.add(line);
                remaining = remaining.substring(line.length()).trim();
            }
        }

        return lines;
    }

    private float drawWrappedText(PDPageContentStream content, PDFont font, float fontSize, float x, float y,
                                  List<String> lines, float leading) throws IOException {
        float currentY = y;
        for (String line : lines) {
            drawText(content, font, fontSize, x, currentY, line);
            currentY -= leading;
        }
        return currentY;
    }

    private void drawCenteredParagraph(PDPageContentStream content, PDFont font, float fontSize, float x, float y,
                                       float width, String text, float leading) throws IOException {
        List<String> lines = wrapText(text, font, fontSize, width);
        float currentY = y;
        for (String line : lines) {
            drawCenteredText(content, font, fontSize, x, currentY, width, line);
            currentY -= leading;
        }
    }

    private void drawCenteredText(PDPageContentStream content, PDFont font, float fontSize,
                                  float x, float y, float width, String text) throws IOException {
        float actualWidth = textWidth(font, fontSize, safe(text));
        float textX = x + Math.max(0f, (width - actualWidth) / 2f);
        drawText(content, font, fontSize, textX, y, text);
    }

    private void drawText(PDPageContentStream content, PDFont font, float fontSize,
                          float x, float y, String text) throws IOException {
        content.beginText();
        content.setFont(font, fontSize);
        content.newLineAtOffset(x, y);
        content.showText(safe(text));
        content.endText();
    }

    private float textWidth(PDFont font, float fontSize, String text) throws IOException {
        return font.getStringWidth(safe(text)) / 1000f * fontSize;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String buildDateLine(String rawValue) {
        LocalDate parsed = parseDate(rawValue);
        if (parsed == null) {
            return "....., ngày ..... tháng ..... năm .....";
        }
        return "....., ngày " + parsed.getDayOfMonth() + " tháng " + parsed.getMonthValue() + " năm " + parsed.getYear();
    }

    private LocalDate parseDate(String rawValue) {
        try {
            return rawValue == null || rawValue.isBlank() ? null : LocalDate.parse(rawValue);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static final class PdfFonts {
        private final PDFont regular;
        private final PDFont bold;
        private final PDFont italic;

        private PdfFonts(PDFont regular, PDFont bold, PDFont italic) {
            this.regular = regular;
            this.bold = bold;
            this.italic = italic;
        }
    }
}
