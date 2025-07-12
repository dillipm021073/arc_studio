import { Router } from 'express';
import { VersionControlService } from '../services/version-control.service';
import { requireAuth } from '../auth';

const router = Router();

// Checkout internal activity for editing
router.post('/internal-activities/:id/checkout', requireAuth, async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    const { initiativeId } = req.body;
    const userId = req.user!.id;

    const version = await VersionControlService.checkoutArtifact(
      'internal_process',
      activityId,
      initiativeId,
      userId
    );

    res.json(version);
  } catch (error) {
    console.error('Error checking out internal activity:', error);
    res.status(500).json({ error: 'Failed to checkout internal activity' });
  }
});

// Checkin internal activity changes
router.post('/internal-activities/:id/checkin', requireAuth, async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    const { initiativeId, data, changeReason } = req.body;
    const userId = req.user!.id;

    const version = await VersionControlService.checkinArtifact(
      'internal_process',
      activityId,
      initiativeId,
      userId,
      data,
      changeReason
    );

    res.json(version);
  } catch (error) {
    console.error('Error checking in internal activity:', error);
    res.status(500).json({ error: 'Failed to checkin internal activity' });
  }
});

// Get version history for internal activity
router.get('/internal-activities/:id/versions', requireAuth, async (req, res) => {
  try {
    const activityId = parseInt(req.params.id);
    const { initiativeId } = req.query;

    if (initiativeId) {
      const version = await VersionControlService.getInitiativeVersion(
        'internal_process',
        activityId,
        initiativeId as string
      );
      res.json(version);
    } else {
      const baseline = await VersionControlService.getBaselineVersion(
        'internal_process',
        activityId
      );
      res.json(baseline);
    }
  } catch (error) {
    console.error('Error getting internal activity version:', error);
    res.status(500).json({ error: 'Failed to get internal activity version' });
  }
});

export default router;