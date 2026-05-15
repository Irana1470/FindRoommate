package com.roommate.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Set;

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

    private final CloudinaryMediaService cloudinaryMediaService;

    public ChatMediaService(CloudinaryMediaService cloudinaryMediaService) {
        this.cloudinaryMediaService = cloudinaryMediaService;
    }

    public UploadedAttachment storeChatAttachment(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File dinh kem khong hop le");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File dinh kem khong duoc vuot qua 10MB");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_TYPES.contains(mimeType)) {
            throw new RuntimeException("Dinh dang file chua duoc ho tro");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().trim() : "attachment";
        CloudinaryMediaService.UploadResult uploadResult = cloudinaryMediaService.upload(file, "roommate/chat");

        return UploadedAttachment.builder()
                .url(uploadResult.getUrl())
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
