package com.roommate.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryMediaService {

    private final Cloudinary cloudinary;

    public UploadResult upload(MultipartFile file, String folder) throws IOException {
        validateConfiguration();

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Vui long chon file hop le");
        }

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "auto",
                        "use_filename", true,
                        "unique_filename", true,
                        "overwrite", false
                )
        );

        String secureUrl = valueAsString(result.get("secure_url"));
        if (secureUrl == null || secureUrl.isBlank()) {
            throw new RuntimeException("Cloudinary khong tra ve URL hop le");
        }

        return UploadResult.builder()
                .url(secureUrl)
                .publicId(valueAsString(result.get("public_id")))
                .resourceType(valueAsString(result.get("resource_type")))
                .format(valueAsString(result.get("format")))
                .build();
    }

    public String uploadImage(MultipartFile file, String folder) throws IOException {
        String contentType = file != null ? file.getContentType() : null;
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new RuntimeException("File phai la anh");
        }

        return upload(file, folder).getUrl();
    }

    private void validateConfiguration() {
        Object cloudName = cloudinary.config.cloudName;
        Object apiKey = cloudinary.config.apiKey;
        Object apiSecret = cloudinary.config.apiSecret;

        if (isBlank(cloudName) || isBlank(apiKey) || isBlank(apiSecret)) {
            throw new RuntimeException("Cloudinary chua duoc cau hinh day du");
        }
    }

    private boolean isBlank(Object value) {
        return value == null || value.toString().trim().isEmpty();
    }

    private String valueAsString(Object value) {
        return value == null ? null : value.toString();
    }

    @Getter
    @Builder
    public static class UploadResult {
        private String url;
        private String publicId;
        private String resourceType;
        private String format;
    }
}
