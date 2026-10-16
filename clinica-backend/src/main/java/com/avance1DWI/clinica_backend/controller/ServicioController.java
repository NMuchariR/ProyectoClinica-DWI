package com.avance1DWI.clinica_backend.controller;

import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.service.ServicioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private final ServicioService servicioService;

    public ServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(servicioService.listar());
    }

    @GetMapping("/buscar")
    public ResponseEntity<?> buscarPorNombre(@RequestParam String nombre) {
        if (nombre.isBlank()) {
            return ResponseEntity.badRequest().body("El nombre de búsqueda es obligatorio");
        }
        return ResponseEntity.ok(servicioService.buscarPorNombre(nombre));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(servicioService.buscarPorId(id));
        } catch (RecursoNoEncontradoException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}