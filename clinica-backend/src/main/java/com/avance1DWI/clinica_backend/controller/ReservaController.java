package com.avance1DWI.clinica_backend.controller;

import com.avance1DWI.clinica_backend.dto.ReservaRequest;
import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    public ResponseEntity<?> crear(Authentication authentication, @Valid @RequestBody ReservaRequest request) {
        try {
            return ResponseEntity.status(201).body(reservaService.crear(authentication.getName(), request));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/mis-reservas")
    public ResponseEntity<?> listarMisReservas(Authentication authentication) {
        try {
            return ResponseEntity.ok(reservaService.listarMisReservas(authentication.getName()));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(Authentication authentication, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(reservaService.cancelar(id, authentication.getName(), false));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}