package com.roommate.util;

import java.time.LocalDate;
import java.util.Locale;
import java.util.regex.Pattern;

public final class InputValidator {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\d{10,11}$");

    private InputValidator() {
    }

    public static String normalizeEmail(String email) {
        String normalized = trimToNull(email);
        if (normalized == null) {
            throw new RuntimeException("Email khong hop le");
        }
        return normalized.toLowerCase(Locale.ROOT);
    }

    public static String normalizeName(String value, String fieldName) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new RuntimeException(fieldName + " khong duoc de trong");
        }
        normalized = normalized.replaceAll("\\s+", " ");
        if (normalized.length() < 2 || normalized.length() > 100) {
            throw new RuntimeException(fieldName + " phai tu 2 den 100 ky tu");
        }
        if (normalized.matches(".*\\d.*")) {
            throw new RuntimeException(fieldName + " khong duoc chua chu so");
        }
        return normalized;
    }

    public static String normalizePhone(String value, String fieldName, boolean required) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            if (required) {
                throw new RuntimeException(fieldName + " khong hop le");
            }
            return null;
        }
        if (!PHONE_PATTERN.matcher(normalized).matches()) {
            throw new RuntimeException(fieldName + " phai gom 10 hoac 11 chu so");
        }
        return normalized;
    }

    public static String normalizeOptionalText(String value, int maxLength, String fieldName) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.replaceAll("\\s+", " ");
        if (normalized.length() > maxLength) {
            throw new RuntimeException(fieldName + " khong duoc vuot qua " + maxLength + " ky tu");
        }
        return normalized;
    }

    public static LocalDate validatePastOrPresent(LocalDate value, String fieldName) {
        if (value != null && value.isAfter(LocalDate.now())) {
            throw new RuntimeException(fieldName + " khong duoc lon hon ngay hien tai");
        }
        return value;
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
