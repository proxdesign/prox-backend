#!/usr/bin/env python3
"""Multi-step recommendation flow for guided furniture discovery."""

import logging
from typing import Dict, List, Optional, Tuple
from enum import Enum
import json
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FlowStage(Enum):
    """Stages in the recommendation flow."""
    INITIAL_DISCOVERY = "initial_discovery"
    SPACE_CLARIFICATION = "space_clarification"
    STYLE_PREFERENCE = "style_preference"
    BUDGET_DISCUSSION = "budget_discussion"
    SIZE_CONSTRAINTS = "size_constraints"
    FEATURE_PREFERENCES = "feature_preferences"
    FINAL_RECOMMENDATIONS = "final_recommendations"
    REFINEMENT = "refinement"

class RecommendationFlowManager:
    """Manages multi-step recommendation conversations."""
    
    def __init__(self):
        self.flow_rules = self._initialize_flow_rules()
    
    def _initialize_flow_rules(self) -> Dict:
        """Define the conversation flow logic."""
        return {
            FlowStage.INITIAL_DISCOVERY: {
                'triggers': ['general_request', 'vague_need'],
                'questions': [
                    "What room or space are you furnishing?",
                    "What's the main furniture piece you need?",
                    "Are you solving a specific problem or starting fresh?"
                ],
                'next_stages': [FlowStage.SPACE_CLARIFICATION, FlowStage.STYLE_PREFERENCE],
                'completion_criteria': ['room_identified', 'furniture_type_clear']
            },
            
            FlowStage.SPACE_CLARIFICATION: {
                'triggers': ['room_mentioned', 'space_constraints'],
                'questions': [
                    "How would you describe the size of your {room}?",
                    "Are there any specific space challenges?",
                    "Do you have measurements or is it roughly small/medium/large?"
                ],
                'next_stages': [FlowStage.STYLE_PREFERENCE, FlowStage.SIZE_CONSTRAINTS],
                'completion_criteria': ['space_size_known', 'constraints_understood']
            },
            
            FlowStage.STYLE_PREFERENCE: {
                'triggers': ['style_mentioned', 'aesthetic_preference'],
                'questions': [
                    "What style appeals to you? (modern, traditional, rustic, etc.)",
                    "Do you have existing furniture you need to match?",
                    "Any colors or materials you particularly love or hate?"
                ],
                'next_stages': [FlowStage.BUDGET_DISCUSSION, FlowStage.FEATURE_PREFERENCES],
                'completion_criteria': ['style_preferences_clear']
            },
            
            FlowStage.BUDGET_DISCUSSION: {
                'triggers': ['budget_mentioned', 'price_concern'],
                'questions': [
                    "What's your budget range for this furniture piece?",
                    "Are you looking for the best value or willing to invest more for quality?",
                    "Is this a one-time purchase or part of a larger furniture project?"
                ],
                'next_stages': [FlowStage.FEATURE_PREFERENCES, FlowStage.FINAL_RECOMMENDATIONS],
                'completion_criteria': ['budget_range_known']
            },
            
            FlowStage.FEATURE_PREFERENCES: {
                'triggers': ['functionality_mentioned', 'usage_pattern'],
                'questions': [
                    "What features are most important to you?",
                    "How will you primarily use this furniture?",
                    "Any must-have features or deal-breakers?"
                ],
                'next_stages': [FlowStage.FINAL_RECOMMENDATIONS, FlowStage.SIZE_CONSTRAINTS],
                'completion_criteria': ['key_features_identified']
            },
            
            FlowStage.SIZE_CONSTRAINTS: {
                'triggers': ['size_mentioned', 'space_limitation'],
                'questions': [
                    "What are the size constraints for this piece?",
                    "Do you have specific measurements?",
                    "Is it more about width, height, or depth that's the main concern?"
                ],
                'next_stages': [FlowStage.FINAL_RECOMMENDATIONS],
                'completion_criteria': ['size_requirements_clear']
            },
            
            FlowStage.FINAL_RECOMMENDATIONS: {
                'triggers': ['enough_info_collected'],
                'questions': [],
                'next_stages': [FlowStage.REFINEMENT],
                'completion_criteria': ['recommendations_presented']
            },
            
            FlowStage.REFINEMENT: {
                'triggers': ['user_feedback', 'preference_adjustment'],
                'questions': [
                    "How do these options look to you?",
                    "Would you like to see something different?",
                    "Any of these catching your eye, or should we adjust our search?"
                ],
                'next_stages': [FlowStage.FINAL_RECOMMENDATIONS, FlowStage.STYLE_PREFERENCE],
                'completion_criteria': ['user_satisfied']
            }
        }
    
    def analyze_conversation_stage(self, session_context: Dict, current_analysis: Dict) -> FlowStage:
        """Determine what stage of the recommendation flow we're in."""
        
        preferences = session_context.get('preferences', {})
        conversation_length = session_context.get('conversation_length', 0)
        
        # Check completion criteria for each stage
        room_known = bool(preferences.get('room_types'))
        style_known = bool(preferences.get('style_preferences'))
        budget_known = bool(preferences.get('budget_range'))
        furniture_known = bool(preferences.get('furniture_types_needed'))
        space_known = bool(preferences.get('space_constraints', {}).get('size_mentioned'))
        
        # Stage logic
        if conversation_length == 0:
            return FlowStage.INITIAL_DISCOVERY
        
        # If we have enough info, move to recommendations
        info_score = sum([room_known, style_known, budget_known, furniture_known])
        if info_score >= 3:
            return FlowStage.FINAL_RECOMMENDATIONS
        
        # Determine next needed info
        if not room_known and current_analysis.get('room_types'):
            return FlowStage.SPACE_CLARIFICATION
        elif not style_known and len(current_analysis.get('style_preferences', [])) == 0:
            return FlowStage.STYLE_PREFERENCE
        elif not budget_known and current_analysis.get('budget_signals', {}).get('range') == 'not_specified':
            return FlowStage.BUDGET_DISCUSSION
        elif not furniture_known:
            return FlowStage.FEATURE_PREFERENCES
        elif not space_known:
            return FlowStage.SIZE_CONSTRAINTS
        else:
            return FlowStage.FINAL_RECOMMENDATIONS
    
    def get_stage_guidance(self, stage: FlowStage, context: Dict) -> Dict:
        """Get guidance for the current conversation stage."""
        
        stage_info = self.flow_rules.get(stage, {})
        
        return {
            'stage': stage.value,
            'suggested_questions': stage_info.get('questions', []),
            'next_stages': [s.value for s in stage_info.get('next_stages', [])],
            'completion_criteria': stage_info.get('completion_criteria', []),
            'should_ask_clarifying_question': stage != FlowStage.FINAL_RECOMMENDATIONS,
            'progress_percentage': self._calculate_progress(context)
        }
    
    def _calculate_progress(self, context: Dict) -> int:
        """Calculate how complete the discovery process is."""
        
        preferences = context.get('preferences', {})
        
        # Key information checkpoints
        checkpoints = [
            bool(preferences.get('room_types')),                    # 20%
            bool(preferences.get('furniture_types_needed')),        # 20% 
            bool(preferences.get('style_preferences')),             # 20%
            bool(preferences.get('budget_range')),                  # 20%
            bool(preferences.get('space_constraints', {}).get('size_mentioned'))  # 20%
        ]
        
        completed = sum(checkpoints)
        return int((completed / len(checkpoints)) * 100)
    
    def generate_clarifying_question(self, stage: FlowStage, context: Dict, current_analysis: Dict) -> Optional[str]:
        """Generate a contextually appropriate clarifying question."""
        
        preferences = context.get('preferences', {})
        stage_info = self.flow_rules.get(stage, {})
        questions = stage_info.get('questions', [])
        
        if not questions:
            return None
        
        # Customize questions based on context
        if stage == FlowStage.SPACE_CLARIFICATION:
            room_types = preferences.get('room_types', current_analysis.get('room_types', []))
            if room_types:
                room = room_types[0].replace('_', ' ')
                return f"How would you describe the size of your {room}? Is it on the smaller side, pretty spacious, or somewhere in between?"
            else:
                return "What room are you furnishing, and how much space are you working with?"
        
        elif stage == FlowStage.STYLE_PREFERENCE:
            furniture_types = preferences.get('furniture_types_needed', current_analysis.get('furniture_types_needed', []))
            if furniture_types:
                furniture = furniture_types[0]
                return f"What style of {furniture} appeals to you? Are you drawn to modern, traditional, rustic, or something else?"
            else:
                return "What style aesthetic do you prefer? Modern, traditional, rustic, industrial, or something else?"
        
        elif stage == FlowStage.BUDGET_DISCUSSION:
            furniture_types = preferences.get('furniture_types_needed', current_analysis.get('furniture_types_needed', []))
            if furniture_types:
                furniture = furniture_types[0]
                return f"What's your budget range for the {furniture}? This helps me show you the best options in your price range."
            else:
                return "What's your budget range for this furniture? I can tailor my recommendations accordingly."
        
        elif stage == FlowStage.FEATURE_PREFERENCES:
            return "What features matter most to you? For example, storage, adjustability, ease of assembly, or specific functionality?"
        
        elif stage == FlowStage.SIZE_CONSTRAINTS:
            return "Are there specific size constraints I should know about? Like maximum width, height, or depth that would work in your space?"
        
        # Default to first question for the stage
        return questions[0] if questions else None
    
    def should_proceed_to_recommendations(self, context: Dict) -> bool:
        """Determine if we have enough info to make good recommendations."""
        
        preferences = context.get('preferences', {})
        
        # Minimum required info
        has_room = bool(preferences.get('room_types'))
        has_furniture_type = bool(preferences.get('furniture_types_needed'))
        
        # Nice to have
        has_style = bool(preferences.get('style_preferences'))
        has_budget = bool(preferences.get('budget_range'))
        
        # Need at least room + furniture type, plus one additional preference
        return has_room and has_furniture_type and (has_style or has_budget)
    
    def get_flow_summary(self, context: Dict) -> Dict:
        """Get a summary of the current flow state."""
        
        preferences = context.get('preferences', {})
        
        return {
            'discovered_info': {
                'rooms': preferences.get('room_types', []),
                'furniture_needed': preferences.get('furniture_types_needed', []),
                'style_preferences': preferences.get('style_preferences', []),
                'budget_range': preferences.get('budget_range'),
                'space_constraints': preferences.get('space_constraints', {}),
                'pain_points': preferences.get('pain_points', [])
            },
            'completion_status': {
                'progress_percentage': self._calculate_progress(context),
                'ready_for_recommendations': self.should_proceed_to_recommendations(context),
                'missing_info': self._identify_missing_info(preferences)
            }
        }
    
    def _identify_missing_info(self, preferences: Dict) -> List[str]:
        """Identify what information is still missing."""
        
        missing = []
        
        if not preferences.get('room_types'):
            missing.append('room_type')
        if not preferences.get('furniture_types_needed'):
            missing.append('furniture_type')
        if not preferences.get('style_preferences'):
            missing.append('style_preference')
        if not preferences.get('budget_range'):
            missing.append('budget_range')
        if not preferences.get('space_constraints', {}).get('size_mentioned'):
            missing.append('size_constraints')
        
        return missing

# Global instance
recommendation_flow = RecommendationFlowManager()