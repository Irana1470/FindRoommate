package com.roommate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class ChatMediaService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "application/zip"
    );
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @Value("${app.upload.dir:uploads}")
    private String uploadRootDir;

    public UploadedAttachment storeChatAttachment(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File đính kèm không hợp lệ");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File đính kèm không được vượt quá 10MB");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_TYPES.contains(mimeType)) {
            throw new RuntimeException("Định dạng file chưa được hỗ trợ");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().trim() : "attachment";
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String extension = "";
        int dotIndex = safeName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = safeName.substring(dotIndex);
        }

        Path uploadDir = Paths.get(uploadRootDir, "chat").toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        String storedName = UUID.randomUUID() + extension;
        Files.copy(file.getInputStream(), uploadDir.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);

        return UploadedAttachment.builder()
                .url("/uploads/chat/" + storedName)
                .originalName(originalName)
                .mimeType(mimeType)
                .size(file.getSize())
                .messageType(IMAGE_TYPES.contains(mimeType) ? "IMAGE" : "FILE")
                .build();
    }

    public record AllowedIceServers(List<String> urls, String username, String credential) {
    }

    @lombok.Data
    @lombok.Builder
    public static class UploadedAttachment {
        private String url;
        private String originalName;
        private String mimeType;
        private Long size;
        private String messageType;
    }
}
