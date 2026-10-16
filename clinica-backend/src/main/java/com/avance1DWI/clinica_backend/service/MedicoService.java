package com.avance1DWI.clinica_backend.service;

import com.avance1DWI.clinica_backend.dto.MedicoResponse;
import com.avance1DWI.clinica_backend.entity.Medico;
import com.avance1DWI.clinica_backend.entity.Reserva;
import com.avance1DWI.clinica_backend.entity.Servicio;
import com.avance1DWI.clinica_backend.enums.EstadoReserva;
import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.repository.MedicoRepository;
import com.avance1DWI.clinica_backend.repository.ReservaRepository;
import com.avance1DWI.clinica_backend.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MedicoService {

    private static final LocalTime HORA_INICIO = LocalTime.of(8, 0);
    private static final LocalTime HORA_FIN = LocalTime.of(18, 0);
    private static final int BLOQUE_MINUTOS = 30;

    private final MedicoRepository medicoRepository;
    private final ReservaRepository reservaRepository;
    private final ServicioRepository servicioRepository;

    public MedicoService(MedicoRepository medicoRepository,
                         ReservaRepository reservaRepository,
                         ServicioRepository servicioRepository) {
        this.medicoRepository = medicoRepository;
        this.reservaRepository = reservaRepository;
        this.servicioRepository = servicioRepository;
    }

    public List<MedicoResponse> listarDisponibles() {
        return medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::convertirAResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicoResponse> disponiblesParaServicio(Long servicioId, String sede,
                                                        LocalDateTime fechaHora, Long reservaExcluirId) {
        Servicio servicio = obtenerServicioConEspecialidad(servicioId);

        return buscarDisponibles(servicio.getEspecialidad(), sede, fechaHora,
                servicio.getDuracionMinutos(), reservaExcluirId);
    }

    @Transactional(readOnly = true)
    public List<LocalTime> horariosParaServicio(Long servicioId, String sede,
                                                LocalDate fecha, Long reservaExcluirId) {
        Servicio servicio = obtenerServicioConEspecialidad(servicioId);

        return horariosDisponibles(servicio.getEspecialidad(), sede, fecha,
                servicio.getDuracionMinutos(), reservaExcluirId);
    }

    @Transactional(readOnly = true)
    public List<MedicoResponse> buscarDisponibles(String especialidad, String sede, LocalDateTime fechaHora,
                                                  int duracionMinutos, Long reservaExcluirId) {
        return buscarMedicos(especialidad, sede).stream()
                .filter(medico -> estaDisponible(medico, fechaHora, duracionMinutos, reservaExcluirId))
                .map(this::convertirAResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LocalTime> horariosDisponibles(String especialidad, String sede, LocalDate fecha,
                                               int duracion, Long reservaExcluirId) {
        List<Medico> medicos = buscarMedicos(especialidad, sede);
        if (medicos.isEmpty()) {
            return List.of();
        }

        LocalDateTime inicioDia = fecha.atStartOfDay();
        LocalDateTime finDia = fecha.plusDays(1).atStartOfDay();
        List<List<Reserva>> reservasPorMedico = medicos.stream()
                .map(medico -> reservaRepository.buscarReservasDelMedico(
                                medico.getId(), EstadoReserva.PENDIENTE, inicioDia, finDia).stream()
                        .filter(reserva -> !reserva.getId().equals(reservaExcluirId))
                        .toList())
                .toList();

        List<LocalTime> horarios = new ArrayList<>();
        LocalDateTime ahora = LocalDateTime.now();

        for (LocalTime hora = HORA_INICIO;
             !hora.plusMinutes(duracion).isAfter(HORA_FIN);
             hora = hora.plusMinutes(BLOQUE_MINUTOS)) {

            LocalDateTime fechaHora = LocalDateTime.of(fecha, hora);
            if (fechaHora.isBefore(ahora)) {
                continue;
            }

            for (List<Reserva> reservas : reservasPorMedico) {
                if (estaLibre(reservas, fechaHora, duracion)) {
                    horarios.add(hora);
                    break;
                }
            }
        }

        return horarios;
    }

    @Transactional(readOnly = true)
    public boolean estaDisponible(Medico medico, LocalDateTime fechaHora,
                                  int duracionMinutos, Long reservaExcluirId) {
        List<Reserva> reservas = reservaRepository.buscarReservasDelMedico(
                medico.getId(), EstadoReserva.PENDIENTE,
                fechaHora.toLocalDate().atStartOfDay(),
                fechaHora.toLocalDate().plusDays(1).atStartOfDay());

        return estaLibre(reservas.stream()
                .filter(reserva -> !reserva.getId().equals(reservaExcluirId))
                .toList(), fechaHora, duracionMinutos);
    }

    private Servicio obtenerServicioConEspecialidad(Long servicioId) {
        Servicio servicio = servicioRepository.findById(servicioId)
                .filter(Servicio::getActivo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Servicio no disponible"));

        if (servicio.getEspecialidad() == null || servicio.getEspecialidad().isBlank()) {
            throw new RuntimeException("El servicio no tiene una especialidad configurada");
        }

        return servicio;
    }

    private List<Medico> buscarMedicos(String especialidad, String sede) {
        return medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(medico -> medico.getEspecialidad().equalsIgnoreCase(especialidad.trim()))
                .filter(medico -> sede == null || sede.equals(medico.getSede()))
                .toList();
    }

    private boolean estaLibre(List<Reserva> reservas, LocalDateTime fechaHora, int duracionMinutos) {
        LocalDateTime finCita = fechaHora.plusMinutes(duracionMinutos);

        return reservas.stream().noneMatch(reserva -> {
            LocalDateTime finExistente = reserva.getFechaHora()
                    .plusMinutes(reserva.getServicio().getDuracionMinutos());
            return fechaHora.isBefore(finExistente) && finCita.isAfter(reserva.getFechaHora());
        });
    }

    private MedicoResponse convertirAResponse(Medico medico) {
        return new MedicoResponse(medico.getId(), medico.getNombre(), medico.getEspecialidad(), medico.getSede());
    }
}
