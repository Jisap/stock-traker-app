"use client"

import FooterLink from '@/components/forms/FooterLink';
import { Button } from '@/components/ui/button';
import React from 'react'
import { useForm } from 'react-hook-form';




const signUp = () => {

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      country: 'US',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology'
    },
    mode: 'onBlur'
  },);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      console.log(data)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <h1 className="form-title">Sign Up & Personalize</h1>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-5"
      >
        {/* Inputs */}

      </form>

      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="yellow-btn w-full mt-5"
      >
        {isSubmitting ? 'Creating Account' : 'Start Your Investing Journey'}
      </Button>

      <FooterLink 
        text="Already have an account?" 
        linkText="Sign in" 
        href="/sign-in" 
      />

    </>
  )
}

export default signUp