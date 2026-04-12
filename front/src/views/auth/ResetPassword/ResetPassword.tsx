import { useState } from 'react'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ActionLink from '@/components/shared/ActionLink'
import ResetPasswordForm from './components/ResetPasswordForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import { useNavigate, useLocation } from 'react-router'

type ResetPasswordProps = {
  signInUrl?: string
}

const ResetPasswordBase = ({ signInUrl = '/sign-in' }: ResetPasswordProps) => {
  const [resetComplete, setResetComplete] = useState(false)
  const [message, setMessage] = useTimeOutMessage()
  const navigate = useNavigate()
  const location = useLocation()

  // 🔑 Récupérer le token depuis l'URL
  const params = new URLSearchParams(location.search)
  const token = params.get('token') || ''

  const handleContinue = () => {
    navigate(signInUrl)
  }

  if (!token) {
    return (
      <div className="p-4 max-w-md mx-auto mt-10">
        <Alert showIcon type="danger">
          Invalid or expired reset link
        </Alert>
        <div className="mt-4 text-center">
          <ActionLink to="/forgot-password">Request a new link</ActionLink>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="mb-6">
        {resetComplete ? (
          <>
            <h3 className="mb-1">Reset done</h3>
            <p className="font-semibold heading-text">
              Your password has been successfully reset
            </p>
          </>
        ) : (
          <>
            <h3 className="mb-1">Set new password</h3>
            <p className="font-semibold heading-text">
              Your new password must be different from previous password
            </p>
          </>
        )}
      </div>

      {message && (
        <Alert showIcon className="mb-4" type="danger">
          <span className="break-all">{message}</span>
        </Alert>
      )}

      <ResetPasswordForm
        token={token} // 🔑 token passé au formulaire
        resetComplete={resetComplete}
        setMessage={setMessage}
        setResetComplete={setResetComplete}
      >
        <Button
          block
          variant="solid"
          type="button"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </ResetPasswordForm>

      <div className="mt-4 text-center">
        <span>Back to </span>
        <ActionLink to={signInUrl} className="heading-text font-bold" themeColor={false}>
          Sign in
        </ActionLink>
      </div>
    </div>
  )
}

const ResetPassword = () => <ResetPasswordBase />

export default ResetPassword
export { ResetPasswordBase }