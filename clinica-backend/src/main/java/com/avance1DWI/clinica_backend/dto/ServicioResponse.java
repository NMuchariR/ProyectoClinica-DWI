package com.avance1DWI.clinica_backend.dto;

import java.math.BigDecimal;

public record ServicioResponse(
        Long id,
        String nombre,
        String especialidad,
        String descripcion,
        BigDecimal precio,
        Integer duracionMinutos,
        Boolean activo
) {
}