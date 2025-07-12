import { Router } from 'express';
import { VersionControlService } from '../services/version-control.service';
import { requireAuth } from '../auth';

const router = Router();

// Checkout technical process for editing
router.post('/technical-processes/:id/checkout', requireAuth, async (req, res) => {
  try {
    const processId = parseInt(req.params.id);
    const { initiativeId } = req.body;
    const userId = req.user!.id;

    const version = await VersionControlService.checkoutArtifact(
      'technical_process',
      processId,
      initiativeId,
      userId
    );

    res.json(version);
  } catch (error) {
    console.error('Error checking out technical process:', error);
    res.status(500).json({ error: 'Failed to checkout technical process' });
  }
});

// Checkin technical process changes
router.post('/technical-processes/:id/checkin', requireAuth, async (req, res) => {
  try {
    const processId = parseInt(req.params.id);
    const { initiativeId, data, changeReason } = req.body;
    const userId = req.user!.id;

    const version = await VersionControlService.checkinArtifact(
      'technical_process',
      processId,
      initiativeId,
      userId,
      data,
      changeReason
    );

    res.json(version);
  } catch (error) {
    console.error('Error checking in technical process:', error);
    res.status(500).json({ error: 'Failed to checkin technical process' });
  }
});

// Get version history for technical process
router.get('/technical-processes/:id/versions', requireAuth, async (req, res) => {
  try {
    const processId = parseInt(req.params.id);
    const { initiativeId } = req.query;

    if (initiativeId) {
      const version = await VersionControlService.getInitiativeVersion(
        'technical_process',
        processId,
        initiativeId as string
      );
      res.json(version);
    } else {
      const baseline = await VersionControlService.getBaselineVersion(
        'technical_process',
        processId
      );
      res.json(baseline);
    }
  } catch (error) {
    console.error('Error getting technical process version:', error);
    res.status(500).json({ error: 'Failed to get technical process version' });
  }
});

export default router;