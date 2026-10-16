package com.avance1DWI.clinica_backend.controller;

import com.avance1DWI.clinica_backend.dto.ServicioRequest;
import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.service.ServicioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/servicios")
public class AdminServicioController {

    private final ServicioService servicioService;

    public AdminServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody ServicioRequest request) {
        try {
            return ResponseEntity.status(201).body(servicioService.crear(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody ServicioRequest request) {
        try {
            return ResponseEntity.ok(servicioService.actualizar(id, request));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            servicioService.eliminar(id);
            return ResponseEntity.ok("Servicio eliminado correctamente");
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}