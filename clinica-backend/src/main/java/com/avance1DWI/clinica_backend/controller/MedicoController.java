package com.avance1DWI.clinica_backend.controller;

import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.service.MedicoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/medicos")
public class MedicoController {

    private final MedicoService medicoService;

    public MedicoController(MedicoService medicoService) {
        this.medicoService = medicoService;
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(medicoService.listarDisponibles());
    }

    @GetMapping("/disponibles")
    public ResponseEntity<?> disponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime hora,
            @RequestParam Long servicioId,
            @RequestParam String sede,
            @RequestParam(required = false) Long excluirReservaId) {
        try {
            return ResponseEntity.ok(medicoService.disponiblesParaServicio(
                    servicioId, sede, LocalDateTime.of(fecha, hora), excluirReservaId));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/horarios-disponibles")
    public ResponseEntity<?> horariosDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam Long servicioId,
            @RequestParam String sede,
            @RequestParam(required = false) Long excluirReservaId) {
        try {
            return ResponseEntity.ok(medicoService.horariosParaServicio(
                    servicioId, sede, fecha, excluirReservaId));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
