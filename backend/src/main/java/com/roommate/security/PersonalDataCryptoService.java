package com.roommate.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class PersonalDataCryptoService {

    private static final String ENCRYPTION_PREFIX = "enc:v1:";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.security.personal-data.secret:${app.jwt.secret}}")
    private String configuredSecret;

    private SecretKeySpec secretKeySpec;

    @PostConstruct
    void init() {
        if (configuredSecret == null || configuredSecret.isBlank()) {
            throw new IllegalStateException("Thieu app.security.personal-data.secret");
        }

        byte[] keyBytes = sha256(configuredSecret.trim());
        secretKeySpec = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return plainText;
        }
        if (isEncrypted(plainText)) {
            return plainText;
        }

        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            byte[] payload = new byte[iv.length + encryptedBytes.length];

            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(encryptedBytes, 0, payload, iv.length, encryptedBytes.length);

            return ENCRYPTION_PREFIX + Base64.getEncoder().encodeToString(payload);
        } catch (Exception ex) {
            throw new RuntimeException("Khong the ma hoa du lieu nhay cam", ex);
        }
    }

    public String decrypt(String encryptedValue) {
        if (encryptedValue == null || encryptedValue.isBlank()) {
            return encryptedValue;
        }
        if (!isEncrypted(encryptedValue)) {
            return encryptedValue;
        }

        try {
            byte[] payload = Base64.getDecoder().decode(encryptedValue.substring(ENCRYPTION_PREFIX.length()));
            if (payload.length <= IV_LENGTH) {
                throw new IllegalArgumentException("Payload ma hoa khong hop le");
            }

            byte[] iv = new byte[IV_LENGTH];
            byte[] encryptedBytes = new byte[payload.length - IV_LENGTH];

            System.arraycopy(payload, 0, iv, 0, IV_LENGTH);
            System.arraycopy(payload, IV_LENGTH, encryptedBytes, 0, encryptedBytes.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new RuntimeException("Khong the giai ma du lieu nhay cam", ex);
        }
    }

    public String hashCitizenId(String citizenId) {
        if (citizenId == null || citizenId.isBlank()) {
            return null;
        }

        String normalizedValue = citizenId.replaceAll("\\D", "");
        if (normalizedValue.isBlank()) {
            return null;
        }

        return HexFormat.of().formatHex(sha256(normalizedValue));
    }

    public boolean isEncrypted(String value) {
        return value != null && value.startsWith(ENCRYPTION_PREFIX);
    }

    private byte[] sha256(String value) {
        return sha256(value.getBytes(StandardCharsets.UTF_8));
    }

    private byte[] sha256(byte[] value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return digest.digest(value);
        } catch (Exception ex) {
            throw new RuntimeException("Khong the bam du lieu nhay cam", ex);
        }
    }
}
