package com.avance1DWI.clinica_backend.dto;

import java.util.List;

public record ReporteResponse(
        long totalReservas,
        List<ConteoResponse> porServicio,
        List<ConteoResponse> porEstado
) {
}