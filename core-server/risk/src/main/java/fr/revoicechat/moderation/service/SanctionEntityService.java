package fr.revoicechat.moderation.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import fr.revoicechat.moderation.model.Sanction;
import fr.revoicechat.moderation.repository.SanctionRepository;
import fr.revoicechat.moderation.representation.SanctionFilterParams;
import fr.revoicechat.web.error.ResourceNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class SanctionEntityService {

  private final EntityManager entityManager;
  private final SanctionRepository sanctionRepository;

  public SanctionEntityService(EntityManager entityManager, SanctionRepository sanctionRepository) {
    this.entityManager = entityManager;
    this.sanctionRepository = sanctionRepository;
  }

  public Sanction get(final UUID id) {
    return Optional.of(entityManager.find(Sanction.class, id))
                   .orElseThrow(() -> new ResourceNotFoundException(Sanction.class, id));
  }

  @Transactional
  public List<Sanction> getAll(final SanctionFilterParams params) {
    return sanctionRepository.findAll(params).toList();
  }
}
