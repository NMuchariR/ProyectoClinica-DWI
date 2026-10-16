package com.avance1DWI.clinica_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ReservaResponse(
        Long id,
        String pacienteNombre,
        String pacienteCorreo,
        Long servicioId,
        String servicioNombre,
        BigDecimal servicioPrecio,
        Long medicoId,
        String medicoNombre,
        String medicoEspecialidad,
        String sede,
        LocalDateTime fechaHora,
        LocalDateTime fechaCreacion,
        String motivoConsulta,
        String estado
) {
}