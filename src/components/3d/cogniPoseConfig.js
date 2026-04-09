import initialPose from '../../assets/cogni/cogni-initialpose.png';
import brainstormingPose from '../../assets/cogni/cogni-brainstorming.png';
import happyPose from '../../assets/cogni/cogni-happy.png';
import happy2Pose from '../../assets/cogni/cogni-happy2.png';
import lovePose from '../../assets/cogni/cogni-love.png';

export const COGNI_POSES = {
  IDLE: 'idle',
  CURIOUS: 'curious',
  WAVING: 'waving',
  THINKING: 'thinking',
  POINTING: 'pointing',
  CELEBRATING: 'celebrating',
  JUMPING: 'jumping',
  DANCING: 'dancing',
  INTERACTION_A: 'interactionA',
  INTERACTION_B: 'interactionB',
};

export const COGNI_FALLBACK_POSE = COGNI_POSES.IDLE;
export const COGNI_POSE_TEXTURES = {
  [COGNI_POSES.IDLE]: initialPose,
  [COGNI_POSES.CURIOUS]: brainstormingPose,
  [COGNI_POSES.WAVING]: happyPose,
  [COGNI_POSES.THINKING]: brainstormingPose,
  [COGNI_POSES.POINTING]: lovePose,
  [COGNI_POSES.CELEBRATING]: happy2Pose,
  [COGNI_POSES.JUMPING]: happy2Pose,
  [COGNI_POSES.DANCING]: happyPose,
  [COGNI_POSES.INTERACTION_A]: lovePose,
  [COGNI_POSES.INTERACTION_B]: initialPose,
};

export function normalizePose(pose) {
  if (!pose) return COGNI_FALLBACK_POSE;

  const aliasMap = {
    wave: COGNI_POSES.WAVING,
    waving: COGNI_POSES.WAVING,
    excited: COGNI_POSES.WAVING,
    celebrate: COGNI_POSES.CELEBRATING,
    celebration: COGNI_POSES.CELEBRATING,
  };

  return COGNI_POSE_TEXTURES[pose]
    ? pose
    : aliasMap[pose] || COGNI_FALLBACK_POSE;
}
