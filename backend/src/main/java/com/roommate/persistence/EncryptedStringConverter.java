package com.roommate.persistence;

import com.roommate.config.SpringContextHolder;
import com.roommate.security.PersonalDataCryptoService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return cryptoService().encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return cryptoService().decrypt(dbData);
    }

    private PersonalDataCryptoService cryptoService() {
        return SpringContextHolder.getBean(PersonalDataCryptoService.class);
    }
}
