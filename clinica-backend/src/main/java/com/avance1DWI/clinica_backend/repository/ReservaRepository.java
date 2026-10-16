package com.avance1DWI.clinica_backend.repository;

import com.avance1DWI.clinica_backend.dto.ConteoResponse;
import com.avance1DWI.clinica_backend.entity.Reserva;
import com.avance1DWI.clinica_backend.enums.EstadoReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    List<Reserva> findByUsuarioIdOrderByFechaHoraDesc(Long usuarioId);

    List<Reserva> findAllByOrderByFechaHoraDesc();

    boolean existsByServicioIdAndFechaHoraAndEstado(Long servicioId, LocalDateTime fechaHora, EstadoReserva estado);

    @Query("SELECT r FROM Reserva r WHERE r.medico.id = :medicoId AND r.estado = :estado " +
            "AND r.fechaHora >= :desde AND r.fechaHora < :hasta")
    List<Reserva> buscarReservasDelMedico(
            @Param("medicoId") Long medicoId,
            @Param("estado") EstadoReserva estado,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    @Query("SELECT r FROM Reserva r WHERE r.usuario.id = :usuarioId AND r.estado = :estado " +
            "AND r.fechaHora >= :desde AND r.fechaHora < :hasta " +
            "AND (:reservaExcluirId IS NULL OR r.id <> :reservaExcluirId)")
    List<Reserva> buscarReservasDelPaciente(
            @Param("usuarioId") Long usuarioId,
            @Param("estado") EstadoReserva estado,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta,
            @Param("reservaExcluirId") Long reservaExcluirId
    );

    @Query("SELECT new com.avance1DWI.clinica_backend.dto.ConteoResponse(r.servicio.nombre, COUNT(r)) " +
            "FROM Reserva r GROUP BY r.servicio.nombre ORDER BY COUNT(r) DESC")
    List<ConteoResponse> contarPorServicio();

    @Query("SELECT new com.avance1DWI.clinica_backend.dto.ConteoResponse(r.estado, COUNT(r)) " +
            "FROM Reserva r GROUP BY r.estado")
    List<ConteoResponse> contarPorEstado();
}