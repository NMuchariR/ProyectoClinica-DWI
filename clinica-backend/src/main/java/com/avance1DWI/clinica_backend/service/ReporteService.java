package com.avance1DWI.clinica_backend.service;

import com.avance1DWI.clinica_backend.dto.ReporteResponse;
import com.avance1DWI.clinica_backend.repository.ReservaRepository;
import org.springframework.stereotype.Service;

@Service
public class ReporteService {

    private final ReservaRepository reservaRepository;

    public ReporteService(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    public ReporteResponse generarReporte() {
        return new ReporteResponse(
                reservaRepository.count(),
                reservaRepository.contarPorServicio(),
                reservaRepository.contarPorEstado()
        );
    }
}