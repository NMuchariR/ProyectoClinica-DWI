package com.avance1DWI.clinica_backend.service;

import com.avance1DWI.clinica_backend.dto.ReservaRequest;
import com.avance1DWI.clinica_backend.dto.ReservaResponse;
import com.avance1DWI.clinica_backend.entity.Medico;
import com.avance1DWI.clinica_backend.entity.Reserva;
import com.avance1DWI.clinica_backend.entity.Servicio;
import com.avance1DWI.clinica_backend.entity.Usuario;
import com.avance1DWI.clinica_backend.enums.EstadoReserva;
import com.avance1DWI.clinica_backend.enums.Rol;
import com.avance1DWI.clinica_backend.exception.RecursoNoEncontradoException;
import com.avance1DWI.clinica_backend.repository.MedicoRepository;
import com.avance1DWI.clinica_backend.repository.ReservaRepository;
import com.avance1DWI.clinica_backend.repository.ServicioRepository;
import com.avance1DWI.clinica_backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final MedicoRepository medicoRepository;
    private final MedicoService medicoService;
    private final ServicioRepository servicioRepository;
    private final UsuarioRepository usuarioRepository;

    public ReservaService(ReservaRepository reservaRepository,
                          MedicoRepository medicoRepository,
                          MedicoService medicoService,
                          ServicioRepository servicioRepository,
                          UsuarioRepository usuarioRepository) {
        this.reservaRepository = reservaRepository;
        this.medicoRepository = medicoRepository;
        this.medicoService = medicoService;
        this.servicioRepository = servicioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public ReservaResponse crear(String correo, ReservaRequest request) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
        bloquearUsuario(usuario.getId());
        return registrarReserva(usuario, request);
    }

    @Transactional
    public ReservaResponse crearParaPaciente(Long pacienteId, ReservaRequest request) {
        Usuario paciente = usuarioRepository.findById(pacienteId)
                .filter(usuario -> usuario.getRol() == Rol.PACIENTE)
                .orElseThrow(() -> new RecursoNoEncontradoException("Paciente no encontrado"));
        paciente = bloquearUsuario(pacienteId);
        if (paciente.getRol() != Rol.PACIENTE) {
            throw new RecursoNoEncontradoException("Paciente no encontrado");
        }
        return registrarReserva(paciente, request);
    }

    private ReservaResponse registrarReserva(Usuario usuario, ReservaRequest request) {
        Servicio servicio = obtenerServicioActivo(request.getServicioId());
        Medico medico = obtenerMedicoActivo(request.getMedicoId());
        validarServicioMedicoSede(servicio, medico, request.getSede());
        validarChoquePaciente(usuario, request.getFechaHora(), servicio, null);
        validarHorario(request.getFechaHora(), servicio, medico, null);

        Reserva nueva = new Reserva(usuario, servicio, medico, request.getFechaHora(),
                request.getMotivoConsulta().trim(), request.getSede(), EstadoReserva.PENDIENTE);

        return convertirAResponse(reservaRepository.save(nueva));
    }

    @Transactional
    public ReservaResponse actualizarComoAdministrador(Long id, ReservaRequest request) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Reserva no encontrada"));
        if (reserva.getEstado() == EstadoReserva.CANCELADA) {
            throw new RuntimeException("No se puede modificar una reserva cancelada");
        }

        Servicio servicio = obtenerServicioActivo(request.getServicioId());
        Medico medico = obtenerMedicoActivo(request.getMedicoId());
        bloquearUsuario(reserva.getUsuario().getId());
        validarServicioMedicoSede(servicio, medico, request.getSede());
        validarChoquePaciente(reserva.getUsuario(), request.getFechaHora(), servicio, id);
        validarHorario(request.getFechaHora(), servicio, medico, id);
        reserva.setServicio(servicio);
        reserva.setMedico(medico);
        reserva.setSede(request.getSede());
        reserva.setFechaHora(request.getFechaHora());
        reserva.setMotivoConsulta(request.getMotivoConsulta().trim());
        return convertirAResponse(reservaRepository.save(reserva));
    }

    private Servicio obtenerServicioActivo(Long servicioId) {
        return servicioRepository.findById(servicioId)
                .filter(Servicio::getActivo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Servicio no disponible"));
    }

    private Medico obtenerMedicoActivo(Long medicoId) {
        return medicoRepository.findById(medicoId)
                .filter(Medico::getActivo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Médico no disponible"));
    }

    private void validarServicioMedicoSede(Servicio servicio, Medico medico, String sede) {
        if (sede == null || sede.isBlank()) {
            throw new RuntimeException("Selecciona una sede válida");
        }
        if (servicio.getEspecialidad() == null
                || !servicio.getEspecialidad().equalsIgnoreCase(medico.getEspecialidad())) {
            throw new RuntimeException("El profesional no corresponde al servicio seleccionado");
        }
        if (!sede.equals(medico.getSede())) {
            throw new RuntimeException("El profesional no atiende en la sede seleccionada");
        }
    }

    private Usuario bloquearUsuario(Long usuarioId) {
        return usuarioRepository.buscarPorIdConBloqueo(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    private void validarChoquePaciente(Usuario paciente, LocalDateTime fechaHora,
                                       Servicio servicio, Long reservaExcluirId) {
        LocalDateTime inicioDia = fechaHora.toLocalDate().atStartOfDay();
        LocalDateTime finDia = inicioDia.plusDays(1);
        LocalDateTime finNueva = fechaHora.plusMinutes(servicio.getDuracionMinutos());
        boolean tieneChoque = reservaRepository.buscarReservasDelPaciente(
                        paciente.getId(), EstadoReserva.PENDIENTE, inicioDia, finDia, reservaExcluirId)
                .stream()
                .anyMatch(reserva -> {
                    LocalDateTime finExistente = reserva.getFechaHora()
                            .plusMinutes(reserva.getServicio().getDuracionMinutos());
                    return fechaHora.isBefore(finExistente) && finNueva.isAfter(reserva.getFechaHora());
                });
        if (tieneChoque) {
            throw new RuntimeException("Ya tienes una cita en ese horario. Elige otra hora para evitar que se superpongan.");
        }
    }

    private void validarHorario(LocalDateTime fechaHora, Servicio servicio, Medico medico, Long reservaExcluirId) {
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("No puedes reservar en una fecha y hora pasadas");
        }

        if (fechaHora.getMinute() % 30 != 0 || fechaHora.getSecond() != 0 || fechaHora.getNano() != 0
                || fechaHora.getHour() < 8
                || fechaHora.toLocalTime().plusMinutes(servicio.getDuracionMinutos())
                .isAfter(java.time.LocalTime.of(18, 0))) {
            throw new RuntimeException("El horario de atención es de 08:00 a 18:00, en bloques de 30 minutos");
        }

        if (!medicoService.estaDisponible(medico, fechaHora, servicio.getDuracionMinutos(), reservaExcluirId)) {
            throw new RuntimeException("El médico ya tiene una cita en ese horario");
        }
    }

    public List<ReservaResponse> listarMisReservas(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        return reservaRepository.findByUsuarioIdOrderByFechaHoraDesc(usuario.getId()).stream()
                .map(this::convertirAResponse)
                .toList();
    }

    public List<ReservaResponse> listarTodas() {
        return reservaRepository.findAllByOrderByFechaHoraDesc().stream()
                .map(this::convertirAResponse)
                .toList();
    }

    public ReservaResponse cancelar(Long id, String correo, boolean esAdmin) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Reserva no encontrada"));

        if (!esAdmin && !reserva.getUsuario().getCorreo().equals(correo)) {
            throw new RecursoNoEncontradoException("Reserva no encontrada");
        }

        if (reserva.getEstado() == EstadoReserva.CANCELADA) {
            throw new RuntimeException("La reserva ya está cancelada");
        }

        reserva.setEstado(EstadoReserva.CANCELADA);

        return convertirAResponse(reservaRepository.save(reserva));
    }

    private ReservaResponse convertirAResponse(Reserva r) {
        return new ReservaResponse(
                r.getId(),
                r.getUsuario().getNombre() + " " + r.getUsuario().getApellido(),
                r.getUsuario().getCorreo(),
                r.getServicio().getId(),
                r.getServicio().getNombre(),
                r.getServicio().getPrecio(),
                r.getMedico() == null ? null : r.getMedico().getId(),
                r.getMedico() == null ? "Sin médico asignado" : r.getMedico().getNombre(),
                r.getMedico() == null ? null : r.getMedico().getEspecialidad(),
                r.getSede(),
                r.getFechaHora(),
                r.getFechaCreacion(),
                r.getMotivoConsulta(),
                r.getEstado().name()
        );
    }
}