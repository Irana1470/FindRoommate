package com.roommate.persistence;

import com.roommate.config.SpringContextHolder;
import com.roommate.security.PersonalDataCryptoService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.time.LocalDate;

@Converter
public class EncryptedLocalDateConverter implements AttributeConverter<LocalDate, String> {

    @Override
    public String convertToDatabaseColumn(LocalDate attribute) {
        if (attribute == null) {
            return null;
        }

        return cryptoService().encrypt(attribute.toString());
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbData) {
        String decryptedValue = cryptoService().decrypt(dbData);
        if (decryptedValue == null || decryptedValue.isBlank()) {
            return null;
        }

        return LocalDate.parse(decryptedValue);
    }

    private PersonalDataCryptoService cryptoService() {
        return SpringContextHolder.getBean(PersonalDataCryptoService.class);
    }
}
