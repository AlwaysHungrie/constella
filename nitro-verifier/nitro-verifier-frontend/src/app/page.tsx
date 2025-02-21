'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SERVER_URL = 'https://nitro-verifier.pineappl.xyz/api'

const defaultValues = {
  certificate:
    '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\n',
  awsRootCertificate:
    'MIICETCCAZagAwIBAgIRAPkxdWgbkK/hHUbMtOTn+FYwCgYIKoZIzj0EAwMwSTELMAkGA1UEBhMCVVMxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMRswGQYDVQQDDBJhd3Mubml0cm8tZW5jbGF2ZXMwHhcNMTkxMDI4MTMyODA1WhcNNDkxMDI4MTQyODA1WjBJMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGQW1hem9uMQwwCgYDVQQLDANBV1MxGzAZBgNVBAMMEmF3cy5uaXRyby1lbmNsYXZlczB2MBAGByqGSM49AgEGBSuBBAAiA2IABPwCVOumCMHzaHDimtqQvkY4MpJzbolL//Zy2YlES1BR5TSksfbb48C8WBoyt7F2Bw7eEtaaP+ohG2bnUs990d0JX28TcPQXCEPZ3BABIeTPYwEoCWZEh8l5YoQwTcU/9KNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUkCW1DdkFR+eWw5b6cp3PmanfS5YwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYCMQCjfy+Rocm9Xue4YnwWmNJVA44fA0P5W2OpYow9OYCVRaEevL8uO1XYru5xtMPWrfMCMQCi85sWBbJwKKXdS6BptQFuZbT73o/gBh1qUxl/nNr12UO8Yfwr6wPLb+6NIwLz3/Y=',
  pcr0: '294e8442cb9eccf0a6e0f7052cf43b2d294f557628a55d7ba7b0137aa13d944c90bd5f627cb6de29c60b7b861e790ea3',
  pcr1: '0343b056cd8485ca7890ddd833476d78460aed2aa161548e4e26bedf321726696257d623e8805f3f605946b3d8b0c6aa',
  pcr2: '4e805c51312651e9aebd8ea6bed35750f6c21d94110fcc02db66bbd321f605eaf863ba407e513ea93dc3b2b3f9f6922d',
  expiryDate: '2025-02-21T03:49:33.199Z',
}

interface FormFields {
  certificate: string
  awsRootCertificate: string
  pcr0: string
  pcr1: string
  pcr2: string
  expiryDate: string
  expiryDateInput: string
  expiryTimeInput: string
}

const inputStyle =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100'
const labelStyle = 'block text-sm font-medium text-gray-700 mt-4'

const FormComponent: React.FC = () => {
  const [formData, setFormData] = useState<FormFields>({
    ...defaultValues,
    expiryDateInput: defaultValues.expiryDate.split('T')[0],
    expiryTimeInput: defaultValues.expiryDate.split('T')[1].slice(0, 5),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      
      if (name === 'expiryDateInput' || name === 'expiryTimeInput') {
        try {
          const dateStr = `${newData.expiryDateInput}T${newData.expiryTimeInput}:00.000Z`
          const date = new Date(dateStr)
          if (!isNaN(date.getTime())) {
            newData.expiryDate = date.toISOString()
          }
        } catch (error) {
          console.error('Error:', error)
        }
      }
      
      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const response = await fetch(`${SERVER_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attestation: formData.certificate,
          pcr0: formData.pcr0,
          pcr1: formData.pcr1,
          pcr2: formData.pcr2,
          expiryDate: formData.expiryDate,
          awsRootCertificate: formData.awsRootCertificate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify certificate')
      }

      const data = await response.json()
      console.log('Verification result:', data)
      if (data.result) {
        alert('Certificate is valid')
      } else {
        alert('Certificate is invalid')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const renderInfo = (info: string) => (
    <div
      className="rounded-sm bg-blue-300 p-2 text-sm text-gray-800 mt-2"
      dangerouslySetInnerHTML={{ __html: info }}
    />
  )

  const renderFormField = (
    name: keyof FormFields,
    label: string,
    type: string = 'text'
  ) => (
    <div>
      <label htmlFor={name} className={labelStyle}>
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={
          type === 'datetime-local'
            ? formData[name].slice(0, 16)
            : formData[name]
        }
        onChange={
          type === 'datetime-local'
            ? (e) => {
                try {
                  const date = new Date(e.target.value)
                  if (isNaN(date.getTime())) {
                    throw new Error('Invalid date')
                  }
                  setFormData((prev) => ({
                    ...prev,
                    expiryDate: date.toISOString(),
                  }))
                } catch (error) {
                  console.error('Error:', error)
                }
              }
            : handleChange
        }
        className={inputStyle}
        required
      />
    </div>
  )

  const renderDateTimeFields = () => (
    <div>
      <label className={labelStyle}>Expiry Date and Time</label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <input
            type="date"
            id="expiryDateInput"
            name="expiryDateInput"
            value={formData.expiryDateInput}
            onChange={handleDateTimeChange}
            className={inputStyle}
            required
          />
        </div>
        <div>
          <input
            type="time"
            id="expiryTimeInput"
            name="expiryTimeInput"
            value={formData.expiryTimeInput}
            onChange={handleDateTimeChange}
            className={inputStyle}
            required
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Nitro Attestation Verifier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="">
              {renderFormField('certificate', 'Attestation Certificate')}
              {renderInfo(
                'You can get the attestation certificate for Constella Wallet by calling <a style="text-decoration: underline;" href="https://api.constella.io/api/v1/config">https://api.constella.io/api/v1/config</a>'
              )}
              
              {renderFormField('awsRootCertificate', 'AWS Root Certificate')}
              {renderInfo(
                'You can get the AWS Root Certificate by visiting <a style="text-decoration: underline;" href="https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip">https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip</a>'
              )}
              
              {renderFormField('pcr0', 'PCR0')}
              {renderFormField('pcr1', 'PCR1')}
              {renderFormField('pcr2', 'PCR2')}
              {renderInfo(
                'You can get the PCR values by building your own envlave image from here <a style="text-decoration: underline;" href="https://github.com/AlwaysHungrie/constella">https://github.com/AlwaysHungrie/constella</a>'
              )}

              {renderDateTimeFields()}
              {renderInfo(
                'Please use the given expiry date provided as Constella Wallet is in development mode and was running in a nitro enclave only till this point in time.'
              )}

              <button
                type="submit"
                className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Verify
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FormComponent
