package com.avance1DWI.clinica_backend;

import com.avance1DWI.clinica_backend.dto.ReservaRequest;
import com.avance1DWI.clinica_backend.entity.Medico;
import com.avance1DWI.clinica_backend.entity.Servicio;
import com.avance1DWI.clinica_backend.repository.MedicoRepository;
import com.avance1DWI.clinica_backend.repository.ServicioRepository;
import com.avance1DWI.clinica_backend.repository.UsuarioRepository;
import com.avance1DWI.clinica_backend.service.MedicoService;
import com.avance1DWI.clinica_backend.service.ReservaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ClinicaBackendApplicationTests {

    @Autowired
    private ServicioRepository servicioRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MedicoService medicoService;

    @Autowired
    private ReservaService reservaService;

    @Test
    void contextLoads() {
    }

    @Test
    void inicializaLosNuevosMedicosYServiciosDeDemostracion() {
        assertTrue(medicoRepository.findByActivoTrueOrderByNombreAsc().size() >= 36);
        assertTrue(servicioRepository.findAll().size() >= 17);
        assertTrue(medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .anyMatch(medico -> "Sede Sur".equals(medico.getSede())));
        assertTrue(medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .anyMatch(medico -> "Sede Este".equals(medico.getSede())));
    }

    @Test
    void ofreceHorariosParaLosServiciosEnSedeSurYSedeEste() {
        LocalDate fecha = LocalDate.now().plusDays(360);
        List<Servicio> servicios = servicioRepository.findAll().stream()
                .filter(Servicio::getActivo)
                .filter(servicio -> servicio.getEspecialidad() != null)
                .toList();

        for (String sede : List.of("Sede Sur", "Sede Este")) {
            for (Servicio servicio : servicios) {
                assertFalse(medicoService.horariosDisponibles(
                                servicio.getEspecialidad(), sede, fecha, servicio.getDuracionMinutos(), null)
                        .isEmpty(), servicio.getNombre() + " no tiene horarios en " + sede);
            }
        }
    }

    @Test
    void inicializaOchoPacientesDeDemostracionConCredencialesSolicitadas() {
        List<String> usuarios = List.of("carlos", "maria", "jose", "ana", "laura", "pedro", "sofia", "diego");

        usuarios.forEach(usuario -> {
            var paciente = usuarioRepository.findByCorreo(usuario + "@gmail.com").orElseThrow();
            assertEquals("PACIENTE", paciente.getRol().name());
            assertTrue(passwordEncoder.matches(usuario + "123", paciente.getPassword()));
        });
    }

    @Test
    void buscarServiciosPorNombreEsParcialYNoDistingueMayusculas() {
        String nombre = "Consulta JPQL " + UUID.randomUUID();
        servicioRepository.saveAndFlush(
                new Servicio(nombre, "Servicio de prueba", new BigDecimal("10.00"), 30, true)
        );

        var resultados = servicioRepository.buscarPorNombre("CONSULTA jpql");

        assertEquals(1, resultados.stream()
                .filter(servicio -> servicio.getNombre().equals(nombre))
                .count());
    }

    @Test
    void confirmaLaCitaYLaGuardaEnElHistorialDelPaciente() {
        var servicio = servicioRepository.findAll().stream()
                .filter(item -> "Medicina general".equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var medico = medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(item -> servicio.getEspecialidad().equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        LocalDateTime fechaHora = LocalDateTime.now().plusDays(90).withHour(10).withMinute(0).withSecond(0).withNano(0);
        ReservaRequest request = new ReservaRequest();
        request.setServicioId(servicio.getId());
        request.setMedicoId(medico.getId());
        request.setSede(medico.getSede());
        request.setFechaHora(fechaHora);
        request.setMotivoConsulta("Control médico");

        var creada = reservaService.crear("mlopez@gmail.com", request);

        assertEquals(medico.getNombre(), creada.medicoNombre());
        assertEquals("Control médico", creada.motivoConsulta());
        assertEquals(creada.id(), reservaService.listarMisReservas("mlopez@gmail.com").stream()
                .filter(reserva -> reserva.id().equals(creada.id()))
                .findFirst()
                .orElseThrow()
                .id());
        assertThrows(RuntimeException.class, () -> reservaService.crear("mlopez@gmail.com", request));
    }

    @Test
    void muestraTodosLosMedicosDisponiblesDeLaEspecialidadSeleccionada() {
        String especialidad = "Medicina general " + UUID.randomUUID();
        var primero = medicoRepository.saveAndFlush(new Medico("Doctora A", especialidad, "Sede Centro", true));
        var segundo = medicoRepository.saveAndFlush(new Medico("Doctor B", especialidad, "Sede Norte", true));
        var servicio = servicioRepository.findAll().get(0);
        LocalDateTime fechaHora = LocalDateTime.now().plusDays(120)
                .withHour(11).withMinute(0).withSecond(0).withNano(0);

        var disponibles = medicoService.buscarDisponibles(especialidad, null, fechaHora, servicio.getDuracionMinutos(), null);

        assertEquals(2, disponibles.size());
        assertEquals(List.of(primero.getId(), segundo.getId()),
                disponibles.stream().map(medico -> medico.id()).sorted().toList());
        assertEquals(List.of(primero.getId()), medicoService.buscarDisponibles(
                        especialidad, "Sede Centro", fechaHora, servicio.getDuracionMinutos(), null)
                .stream().map(medico -> medico.id()).toList());
    }

    @Test
    void ofreceHorariosLibresYRetiraLosQueChocanConOtraReserva() {
        String especialidad = "Especialidad de horarios " + UUID.randomUUID();
        var medico = medicoRepository.saveAndFlush(new Medico("Profesional de prueba", especialidad, true));
        var servicio = servicioRepository.saveAndFlush(
                new Servicio("Servicio de horarios " + UUID.randomUUID(), especialidad,
                        "Prueba", new BigDecimal("25.00"), 30, true)
        );
        LocalDate fecha = LocalDate.now().plusDays(180);
        LocalDateTime ocupada = LocalDateTime.of(fecha, LocalTime.of(10, 0));
        ReservaRequest request = new ReservaRequest();
        request.setServicioId(servicio.getId());
        request.setMedicoId(medico.getId());
        request.setSede(medico.getSede());
        request.setFechaHora(ocupada);
        request.setMotivoConsulta("Cita de prueba");
        reservaService.crear("mlopez@gmail.com", request);

        var horarios = medicoService.horariosDisponibles(
                especialidad, medico.getSede(), fecha, servicio.getDuracionMinutos(), null);

        assertFalse(horarios.contains(LocalTime.of(10, 0)));
        assertTrue(horarios.contains(LocalTime.of(10, 30)));
        assertFalse(horarios.contains(LocalTime.of(18, 0)));
    }

    @Test
    void administradorAgendaYModificaLaCitaDeUnPaciente() {
        var servicio = servicioRepository.findAll().stream()
                .filter(item -> "Medicina general".equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var medico = medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(item -> servicio.getEspecialidad().equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        LocalDateTime fechaInicial = LocalDateTime.now().plusDays(210)
                .withHour(9).withMinute(0).withSecond(0).withNano(0);
        ReservaRequest request = new ReservaRequest();
        request.setServicioId(servicio.getId());
        request.setMedicoId(medico.getId());
        request.setSede(medico.getSede());
        request.setFechaHora(fechaInicial);
        request.setMotivoConsulta("Cita agendada por recepción");

        Long pacienteId = usuarioRepository.findByCorreo("mlopez@gmail.com").orElseThrow().getId();
        var creada = reservaService.crearParaPaciente(pacienteId, request);

        assertEquals("mlopez@gmail.com", creada.pacienteCorreo());
        LocalDateTime nuevaFecha = fechaInicial.plusDays(1);
        request.setFechaHora(nuevaFecha);
        request.setMotivoConsulta("Cambio solicitado por el paciente");

        var actualizada = reservaService.actualizarComoAdministrador(creada.id(), request);

        assertEquals(nuevaFecha, actualizada.fechaHora());
        assertEquals("Cambio solicitado por el paciente", actualizada.motivoConsulta());
        assertEquals(creada.id(), actualizada.id());
    }

    @Test
    void rechazaLaReservaSiElProfesionalNoAtiendeEnLaSedeElegida() {
        var servicio = servicioRepository.findAll().stream()
                .filter(item -> "Medicina general".equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var medico = medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(item -> servicio.getEspecialidad().equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        ReservaRequest request = new ReservaRequest();
        request.setServicioId(servicio.getId());
        request.setMedicoId(medico.getId());
        request.setSede(medico.getSede().equals("Sede Centro") ? "Sede Norte" : "Sede Centro");
        request.setFechaHora(LocalDateTime.now().plusDays(240)
                .withHour(10).withMinute(0).withSecond(0).withNano(0));
        request.setMotivoConsulta("Consulta de prueba");

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> reservaService.crear("mlopez@gmail.com", request));

        assertEquals("El profesional no atiende en la sede seleccionada", error.getMessage());
    }

    @Test
    void impideCrucesDeHorarioDelPacientePeroPermiteOtrasCitasEseMismoDia() {
        var consultaGeneral = servicioRepository.findAll().stream()
                .filter(item -> "Medicina general".equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var cardiologia = servicioRepository.findAll().stream()
                .filter(item -> "Cardiología".equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var medicoGeneral = medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(item -> consultaGeneral.getEspecialidad().equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var cardiologo = medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(item -> cardiologia.getEspecialidad().equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        LocalDate fecha = LocalDate.now().plusDays(300);

        ReservaRequest primera = crearSolicitud(consultaGeneral, medicoGeneral, fecha.atTime(10, 0));
        reservaService.crear("mlopez@gmail.com", primera);

        ReservaRequest seSuperpone = crearSolicitud(cardiologia, cardiologo, fecha.atTime(10, 0));
        RuntimeException error = assertThrows(RuntimeException.class,
                () -> reservaService.crear("mlopez@gmail.com", seSuperpone));
        assertEquals("Ya tienes una cita en ese horario. Elige otra hora para evitar que se superpongan.",
                error.getMessage());

        ReservaRequest consecutiva = crearSolicitud(cardiologia, cardiologo, fecha.atTime(10, 30));
        var creadaConsecutiva = reservaService.crear("mlopez@gmail.com", consecutiva);
        assertEquals(fecha.atTime(10, 30), creadaConsecutiva.fechaHora());

        ReservaRequest posterior = crearSolicitud(cardiologia, cardiologo, fecha.atTime(11, 0));
        var creadaPosterior = reservaService.crear("mlopez@gmail.com", posterior);
        assertEquals(fecha.atTime(11, 0), creadaPosterior.fechaHora());
    }

    @Test
    void administradorNoPuedeReprogramarUnaCitaSobreOtraDelMismoPaciente() {
        var consultaGeneral = servicioRepository.findAll().stream()
                .filter(item -> "Medicina general".equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var cardiologia = servicioRepository.findAll().stream()
                .filter(item -> "Cardiología".equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var medicoGeneral = medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(item -> consultaGeneral.getEspecialidad().equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        var cardiologo = medicoRepository.findByActivoTrueOrderByNombreAsc().stream()
                .filter(item -> cardiologia.getEspecialidad().equals(item.getEspecialidad()))
                .findFirst().orElseThrow();
        LocalDate fecha = LocalDate.now().plusDays(330);
        reservaService.crear("mlopez@gmail.com",
                crearSolicitud(consultaGeneral, medicoGeneral, fecha.atTime(10, 0)));
        Long pacienteId = usuarioRepository.findByCorreo("mlopez@gmail.com").orElseThrow().getId();
        var citaAReprogramar = reservaService.crearParaPaciente(pacienteId,
                crearSolicitud(cardiologia, cardiologo, fecha.atTime(11, 0)));

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> reservaService.actualizarComoAdministrador(citaAReprogramar.id(),
                        crearSolicitud(cardiologia, cardiologo, fecha.atTime(10, 0))));

        assertEquals("Ya tienes una cita en ese horario. Elige otra hora para evitar que se superpongan.",
                error.getMessage());
    }

    private ReservaRequest crearSolicitud(Servicio servicio, Medico medico, LocalDateTime fechaHora) {
        ReservaRequest request = new ReservaRequest();
        request.setServicioId(servicio.getId());
        request.setMedicoId(medico.getId());
        request.setSede(medico.getSede());
        request.setFechaHora(fechaHora);
        request.setMotivoConsulta("Consulta de prueba");
        return request;
    }
}
