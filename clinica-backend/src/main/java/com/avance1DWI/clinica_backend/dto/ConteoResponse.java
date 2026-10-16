package com.avance1DWI.clinica_backend.dto;

import com.avance1DWI.clinica_backend.enums.EstadoReserva;

public record ConteoResponse(String etiqueta, Long total) {
    public ConteoResponse(EstadoReserva estado, Long total) {
        this(estado.name(), total);
    }
}