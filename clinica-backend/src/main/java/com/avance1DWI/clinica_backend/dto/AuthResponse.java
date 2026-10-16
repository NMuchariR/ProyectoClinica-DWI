package com.avance1DWI.clinica_backend.dto;

public record AuthResponse(String token, String nombre, String apellido, String rol) {
}