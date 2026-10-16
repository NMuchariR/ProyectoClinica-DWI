package com.avance1DWI.clinica_backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ReservaRequest {

    @NotNull(message = "Debes elegir un servicio")
    private Long servicioId;

    @NotNull(message = "Debes elegir un médico")
    private Long medicoId;

    @NotBlank(message = "Debes elegir una sede")
    @Size(max = 100, message = "La sede no puede pasar de 100 caracteres")
    private String sede;

    @NotNull(message = "La fecha y hora son obligatorias")
    @Future(message = "La fecha y hora deben ser posteriores al momento actual")
    private LocalDateTime fechaHora;

    @NotBlank(message = "Indica el motivo de la consulta")
    @Size(max = 500, message = "El motivo no puede pasar de 500 caracteres")
    private String motivoConsulta;

    public Long getServicioId() {

        return servicioId;
    }

    public void setServicioId(Long servicioId) {

        this.servicioId = servicioId;
    }

    public Long getMedicoId() {
        return medicoId;
    }

    public void setMedicoId(Long medicoId) {
        this.medicoId = medicoId;
    }

    public String getSede() {
        return sede;
    }

    public void setSede(String sede) {
        this.sede = sede;
    }

    public LocalDateTime getFechaHora() {

        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public String getMotivoConsulta() {
        return motivoConsulta;
    }

    public void setMotivoConsulta(String motivoConsulta) {
        this.motivoConsulta = motivoConsulta;
    }
}